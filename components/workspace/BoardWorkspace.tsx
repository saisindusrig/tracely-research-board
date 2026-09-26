"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  ConnectionMode,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { HandCircle, HandNote, IndexCard } from "@/components/paper";
import FlashToast from "@/components/FlashToast";
import { toast } from "@/components/Toaster";
import { saveNodePosition } from "@/lib/actions/items";
import { plural } from "@/lib/format";
import { nodeTypes } from "./nodes";
import HandEdge, { type HandEdgeType } from "./HandEdge";
import { ClaimForm, EvidenceForm, NoteForm, SourceForm } from "./forms";
import DetailPanel from "./DetailPanel";
import { MobileActionBar, TOOLS, ToolRail, TopBar, ZoomControls } from "./chrome";
import type { BoardData, BoardInfo, Compose, Permissions, Selection } from "./types";

type Props = {
  board: BoardInfo;
  data: BoardData;
  perms: Permissions;
  initialCard?: Selection;
  created?: boolean;
};

const edgeTypes = { hand: HandEdge };

const COMPOSE_HINTS = {
  claim: "one idea per card",
  source: "the link, and what it found",
  evidence: "how does the source bear on the claim?",
  note: "anything worth remembering",
} as const;

/**
 * Builds canvas nodes from board data. Cards without a saved position get a
 * tidy default: claims on top, sources below, notes to the right. Positions
 * already on screen win over server data so a refresh never makes a card jump.
 */
function buildNodes(data: BoardData, prev: Node[], canEdit: boolean, selectedId?: string): Node[] {
  const prevById = new Map(prev.map((n) => [n.id, n]));
  const comments = new Map<string, number>();
  for (const c of data.comments) comments.set(c.targetId, (comments.get(c.targetId) ?? 0) + 1);

  const noteX = Math.max(data.claims.length * 320, data.sources.length * 280, 320) + 80;
  const place = (id: string, saved: { x: number; y: number } | null, fallback: { x: number; y: number }) => {
    const existing = prevById.get(id);
    return {
      position: existing?.position ?? saved ?? fallback,
      measured: existing?.measured,
      selected: id === selectedId,
    };
  };
  const extra = (id: string, i: number) => ({ commentCount: comments.get(id) ?? 0, canConnect: canEdit, ordinal: i + 1 });

  return [
    ...data.claims.map((c, i) => ({
      id: c.id,
      type: "claim",
      data: { ...c, ...extra(c.id, i) },
      ...place(c.id, c.position, { x: i * 320, y: 0 }),
    })),
    ...data.sources.map((s, i) => ({
      id: s.id,
      type: "source",
      data: { ...s, ...extra(s.id, i) },
      ...place(s.id, s.position, { x: i * 280, y: 300 }),
    })),
    ...data.notes.map((n, i) => ({
      id: n.id,
      type: "note",
      data: { ...n, ...extra(n.id, i) },
      ...place(n.id, n.position, { x: noteX, y: i * 200 }),
    })),
  ];
}

export default function BoardWorkspace(props: Props) {
  return (
    <ReactFlowProvider>
      <Workspace {...props} />
    </ReactFlowProvider>
  );
}

function Workspace({ board, data, perms, initialCard, created }: Props) {
  const rf = useReactFlow();
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastPlaced = useRef<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<Selection>(initialCard ?? null);
  const [compose, setCompose] = useState<Compose>(null);

  const [nodes, setNodes] = useState<Node[]>(() => buildNodes(data, [], perms.canEdit, initialCard?.id));
  // Merge fresh server data into the canvas whenever the page is refreshed
  // after a save (adjusting state during render, per React docs).
  const [prevData, setPrevData] = useState(data);
  if (prevData !== data) {
    setPrevData(data);
    setNodes((prev) => buildNodes(data, prev, perms.canEdit, selection?.id));
  }

  const select = useCallback((next: Selection) => {
    setSelection(next);
    setNodes((ns) => ns.map((n) => (n.selected === (n.id === next?.id) ? n : { ...n, selected: n.id === next?.id })));
  }, []);

  const edges = useMemo<HandEdgeType[]>(
    () =>
      data.evidence.map((ev) => ({
        id: ev.id,
        type: "hand",
        source: ev.claimId,
        target: ev.sourceId,
        selected: selection?.type === "evidence" && selection.id === ev.id,
        data: { relationship: ev.relationship, onSelect: (id: string) => select({ type: "evidence", id }) },
      })),
    [data.evidence, selection, select]
  );

  const onNodesChange = useCallback(
    // Selection is driven by our own state; ignore React Flow's select events.
    (changes: NodeChange[]) => setNodes((ns) => applyNodeChanges(changes.filter((c) => c.type !== "select"), ns)),
    []
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    async (_e, _node, dragged) => {
      if (!perms.canEdit) return;
      const results = await Promise.all(
        dragged.map((n) => saveNodePosition(board.id, n.type as "claim" | "source" | "note", n.id, n.position))
      );
      const failed = results.find((r) => !r.ok);
      if (failed && !failed.ok) toast(failed.error, "error");
    },
    [board.id, perms.canEdit]
  );

  const nodeType = useCallback((id: string | null) => nodes.find((n) => n.id === id)?.type, [nodes]);

  const isValidConnection = useCallback(
    (c: Connection | Edge) => {
      const types = [nodeType(c.source), nodeType(c.target)].sort().join("|");
      return types === "claim|source";
    },
    [nodeType]
  );

  const onConnect = useCallback(
    (c: Connection) => {
      const claimId = nodeType(c.source) === "claim" ? c.source : c.target;
      const sourceId = claimId === c.source ? c.target : c.source;
      setCompose({ kind: "evidence", claimId, sourceId });
    },
    [nodeType]
  );

  /**
   * Where a new card goes: near the middle of the visible canvas, in the
   * first nearby spot that doesn't overlap an existing card.
   */
  const getPosition = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const center = rect
      ? rf.screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 3 })
      : { x: 0, y: 0 };
    const start = { x: center.x - 130, y: center.y - 60 };
    const W = 260 + 40; // card width + gap
    const H = 150 + 40;
    const boxes = rf.getNodes().map((n) => ({
      x: n.position.x,
      y: n.position.y,
      w: n.measured?.width ?? 260,
      h: n.measured?.height ?? 150,
    }));
    const free = (x: number, y: number) =>
      boxes.every((b) => x + W - 40 <= b.x || x >= b.x + b.w + 40 || y + H - 40 <= b.y || y >= b.y + b.h + 40);

    // Try nearby slots, preferring below, then to the right, then left/above.
    const slots: { dx: number; dy: number; cost: number }[] = [];
    for (let dy = -2; dy <= 6; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        slots.push({ dx, dy, cost: Math.abs(dx) * 1.6 + Math.abs(dy) + (dx < 0 ? 0.4 : 0) + (dy < 0 ? 0.8 : 0) });
      }
    }
    slots.sort((a, b) => a.cost - b.cost);
    for (const { dx, dy } of slots) {
      const x = start.x + dx * W;
      const y = start.y + dy * H;
      if (free(x, y)) {
        lastPlaced.current = { x, y };
        return { x, y };
      }
    }
    const fallback = { x: start.x, y: start.y + (boxes.length + 1) * 24 };
    lastPlaced.current = fallback;
    return fallback;
  }, [rf]);

  const openCompose = useCallback(
    (kind: "claim" | "source" | "evidence" | "note") => {
      if (kind === "evidence") {
        setCompose({
          kind,
          claimId: selection?.type === "claim" ? selection.id : undefined,
          sourceId: selection?.type === "source" ? selection.id : undefined,
        });
      } else setCompose({ kind });
    },
    [selection]
  );

  // Escape closes the top-most panel; C/S/E/N open the add forms.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
      if (e.key === "Escape") {
        if (compose) setCompose(null);
        else if (selection) select(null);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey || !perms.canEdit) return;
      const tool = TOOLS.find((t) => t.key === e.key.toLowerCase());
      if (tool) {
        e.preventDefault();
        openCompose(tool.kind);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compose, selection, select, openCompose, perms.canEdit]);

  const onInit = useCallback(() => {
    if (initialCard) {
      const node = nodes.find((n) => n.id === initialCard.id);
      if (node) rf.setCenter(node.position.x + 130, node.position.y + 60, { zoom: 1, duration: 300 });
      return;
    }
    // Fitting a whole board onto a phone makes cards unreadable. Frame the
    // first claim at a legible zoom instead; the rest is a pan away.
    if (window.innerWidth < 768) {
      const claims = nodes.filter((n) => n.type === "claim");
      if (claims.length) {
        window.requestAnimationFrame(() =>
          rf.fitView({ nodes: [{ id: claims[0].id }], padding: 0.35, minZoom: 0.7, maxZoom: 0.9 })
        );
      }
    }
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty = data.claims.length + data.sources.length + data.notes.length === 0;

  const composeTitle = compose
    ? `${compose.editId ? "Edit" : compose.kind === "evidence" ? "Connect" : "New"} ${compose.kind}`
    : "";
  const closeCompose = () => setCompose(null);
  /** After adding a card, bring it into view if it landed off-screen. */
  const afterCreate = () => {
    setCompose(null);
    const p = lastPlaced.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    lastPlaced.current = null;
    if (!p || !rect) return;
    const tl = rf.flowToScreenPosition(p);
    const br = rf.flowToScreenPosition({ x: p.x + 260, y: p.y + 150 });
    const visible = tl.x >= rect.left && tl.y >= rect.top && br.x <= rect.right && br.y <= rect.bottom;
    if (!visible) rf.setCenter(p.x + 130, p.y + 75, { zoom: rf.getZoom(), duration: 300 });
  };
  const formProps = { boardId: board.id, onDone: afterCreate, onCancel: closeCompose, getPosition };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {created && (
        <Suspense>
          <FlashToast message="Board created. Add the first claim you want to investigate." param="created" />
        </Suspense>
      )}
      <TopBar board={board} perms={perms} />

      <div className="relative flex min-h-0 flex-1">
        {perms.canEdit && <ToolRail active={compose} onAdd={openCompose} />}

        {/* CANVAS */}
        <div ref={canvasRef} className="relative min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onNodeClick={(_e, n) => select({ type: n.type as "claim" | "source" | "note", id: n.id })}
            onEdgeClick={(_e, edge) => select({ type: "evidence", id: edge.id })}
            onPaneClick={() => select(null)}
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onInit={onInit}
            connectionMode={ConnectionMode.Loose}
            nodesDraggable={perms.canEdit}
            nodesConnectable={perms.canEdit}
            elementsSelectable
            deleteKeyCode={null}
            panOnScroll
            minZoom={0.2}
            maxZoom={2}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            attributionPosition="bottom-left"
            aria-label="Research canvas"
          >
            <Background variant={BackgroundVariant.Lines} gap={24} lineWidth={1} color="hsl(42 30% 84%)" />
          </ReactFlow>

          {isEmpty && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <IndexCard seed={board.id} className="pointer-events-auto max-w-sm px-6 pb-6 pt-5 text-center">
                <p className="font-heading text-2xl text-foreground">A blank page.</p>
                {perms.canEdit ? (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Write down the claim you want to test. Sources and evidence come after.
                    </p>
                    <Button className="mt-5" onClick={() => setCompose({ kind: "claim" })}>
                      Add a claim
                    </Button>
                    <HandNote className="mt-4 block text-[16px]">start with one question</HandNote>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Nothing has been pinned to this board yet.</p>
                )}
              </IndexCard>
            </div>
          )}

          {/* Compact zoom on phones; desktop uses the bottom bar. */}
          <div className="absolute bottom-3 right-3 md:hidden">
            <ZoomControls compact />
          </div>

          {/* COMPOSE PANEL: floating card on desktop, bottom sheet on phones */}
          {compose && (
            <>
              <div className="fixed inset-0 z-40 bg-foreground/30 md:hidden" onClick={closeCompose} aria-hidden />
              <section
                role="dialog"
                aria-label={composeTitle}
                className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-lg border-t border-foreground/25 bg-card pb-[env(safe-area-inset-bottom)] md:absolute md:bottom-auto md:left-4 md:right-auto md:top-4 md:max-h-[calc(100%-2rem)] md:w-[340px] md:rounded-sm md:border md:pb-0 md:[box-shadow:3px_4px_0_hsl(var(--border))]"
              >
                <div className="sticky top-0 z-10 border-b border-destructive/40 bg-card px-5 pb-2.5 pt-3">
                  <span aria-hidden className="mx-auto mb-2 block h-1 w-10 rounded-full bg-border md:hidden" />
                  <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl capitalize text-foreground">{composeTitle}</h2>
                  <button type="button" onClick={closeCompose} aria-label="Close" className="-mr-2 inline-flex size-9 items-center justify-center rounded-md hover:bg-muted">
                    <X className="size-4" />
                  </button>
                  </div>
                  <HandNote tone="ink" className="text-[15px]">{COMPOSE_HINTS[compose.kind]}</HandNote>
                </div>
                <div className="p-5">
                  {compose.kind === "claim" && (
                    <ClaimForm key={compose.editId ?? "new"} {...formProps} editing={data.claims.find((c) => c.id === compose.editId)} />
                  )}
                  {compose.kind === "source" && (
                    <SourceForm key={compose.editId ?? "new"} {...formProps} editing={data.sources.find((s) => s.id === compose.editId)} />
                  )}
                  {compose.kind === "note" && (
                    <NoteForm key={compose.editId ?? "new"} {...formProps} editing={data.notes.find((n) => n.id === compose.editId)} />
                  )}
                  {compose.kind === "evidence" && (
                    <EvidenceForm
                      key={`${compose.editId}-${compose.claimId}-${compose.sourceId}`}
                      boardId={board.id}
                      onDone={closeCompose}
                      onCancel={closeCompose}
                      claims={data.claims}
                      sources={data.sources}
                      editing={data.evidence.find((e) => e.id === compose.editId)}
                      preset={{ claimId: compose.claimId, sourceId: compose.sourceId }}
                    />
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        {/* DETAIL PANEL: right column on desktop, bottom sheet on phones */}
        {selection && (
          <aside
            aria-label="Card details"
            className="fixed inset-x-0 bottom-0 z-30 max-h-[70dvh] overflow-y-auto rounded-t-lg border-t border-foreground/25 bg-card pb-[env(safe-area-inset-bottom)] [box-shadow:0_-3px_0_hsl(var(--border))] md:relative md:z-auto md:max-h-none md:w-[380px] md:shrink-0 md:rounded-none md:border-l md:border-t-0 md:pb-0 md:shadow-none"
          >
            <div className="sticky top-0 z-10 flex justify-end bg-card/95 px-3 pt-2 md:absolute md:right-0 md:bg-transparent">
              <button type="button" onClick={() => select(null)} aria-label="Close details" className="inline-flex size-9 items-center justify-center rounded-md hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="-mt-9 md:mt-0">
              <DetailPanel
                boardId={board.id}
                selection={selection}
                data={data}
                perms={perms}
                onSelect={select}
                onCompose={setCompose}
                onClose={() => select(null)}
              />
            </div>
          </aside>
        )}
      </div>

      {/* DESKTOP STATUS BAR */}
      <footer className="hidden h-11 shrink-0 items-center justify-between gap-4 border-t border-foreground/15 bg-secondary px-3 md:flex">
        <ZoomControls />
        <p className="truncate font-tag text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          {plural(data.claims.length, "claim")} · {plural(data.sources.length, "source")} · {plural(data.evidence.length, "link")} ·{" "}
          {plural(data.notes.length, "note")}
          {!perms.canEdit && <HandCircle tone="pencil" className="ml-4 font-hand text-[14px] normal-case tracking-normal">View only</HandCircle>}
        </p>
      </footer>

      {perms.canEdit ? (
        <MobileActionBar onAdd={openCompose} />
      ) : (
        <p className="shrink-0 border-t border-foreground/15 bg-secondary px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground md:hidden">
          View only · {plural(data.claims.length, "claim")} · {plural(data.sources.length, "source")}
        </p>
      )}
    </div>
  );
}
