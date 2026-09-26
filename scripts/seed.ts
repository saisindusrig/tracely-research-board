/**
 * Seeds demo content so a fresh deployment isn't empty.
 *
 *   npm run seed
 *
 * Creates two demo accounts and a few public boards with claims, sources,
 * evidence, notes and comments. Safe to run repeatedly: it removes and
 * recreates only content owned by the demo accounts.
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectToDatabase } from "../lib/mongodb";
import User from "../models/User";
import Board from "../models/Boards";
import Claim from "../models/Claim";
import Source from "../models/Sources";
import Evidence from "../models/Evidence";
import Note from "../models/Note";
import Comment from "../models/Comment";
import Activity from "../models/Activity";

type Rel = "SUPPORTS" | "CHALLENGES" | "CONTEXT";

type BoardSeed = {
  title: string;
  description: string;
  topic: string;
  claims: { title: string; description?: string; tags: string[]; status?: string }[];
  sources: { title: string; sourceType: string; summary: string }[];
  // [claimIndex, sourceIndex, relationship, why]
  evidence: [number, number, Rel, string][];
  notes: string[];
  comments: { on: ["claim" | "source", number]; by: "demo" | "peer"; text: string }[];
};

const BOARDS: BoardSeed[] = [
  {
    title: "Does remote work change productivity?",
    description: "Collecting what we actually know about output, collaboration and wellbeing when teams work remotely.",
    topic: "Economics",
    claims: [
      { title: "Fully remote work lowers individual productivity", tags: ["remote", "productivity"], status: "DISPUTED" },
      { title: "Hybrid schedules keep output steady while improving retention", tags: ["hybrid", "retention"] },
    ],
    sources: [
      { title: "Randomized trial of hybrid work at a large travel company", sourceType: "Paper", summary: "Two days at home had no measurable effect on performance reviews and reduced resignations." },
      { title: "Call-center experiment on working from home", sourceType: "Paper", summary: "Home-based workers handled more calls, partly from fewer breaks and sick days." },
      { title: "Manager survey on remote collaboration", sourceType: "Article", summary: "Managers report weaker mentoring and slower onboarding for new hires who never meet in person." },
      { title: "Office occupancy dataset, 2020 to 2024", sourceType: "Dataset", summary: "Shows how quickly offices refilled by sector; useful background, not evidence either way." },
    ],
    evidence: [
      [0, 1, "CHALLENGES", "Output went up, not down, in a controlled setting."],
      [0, 2, "SUPPORTS", "Softer skills like mentoring seem to suffer, which may hit productivity later."],
      [1, 0, "SUPPORTS", "Directly tests hybrid and finds retention gains with flat performance."],
      [1, 3, "CONTEXT", "Explains how common hybrid has become."],
    ],
    notes: ["Most studies measure short-term output. Look for anything tracking promotions or skill growth over years."],
    comments: [
      { on: ["claim", 0], by: "peer", text: "Call-center work is very measurable. Not sure it generalizes to creative or engineering roles." },
      { on: ["claim", 0], by: "demo", text: "Agreed, marking this as disputed until we find knowledge-work studies." },
    ],
  },
  {
    title: "Social media and teen anxiety",
    description: "Is heavy social media use a cause of rising anxiety in teenagers, or a symptom of something else?",
    topic: "Psychology",
    claims: [
      { title: "Heavy social media use increases anxiety in teenagers", tags: ["adolescents", "mental-health"] },
      { title: "Lost sleep explains most of the link", description: "Late-night phone use cuts sleep, and poor sleep is a known driver of anxiety.", tags: ["sleep"] },
    ],
    sources: [
      { title: "Longitudinal cohort study of screen time and wellbeing", sourceType: "Paper", summary: "Small but consistent association between hours online and later anxiety symptoms." },
      { title: "National survey controlling for sleep duration", sourceType: "Dataset", summary: "Association weakens sharply once sleep is included in the model." },
      { title: "Explainer: why correlation studies disagree", sourceType: "Video", summary: "Walks through how different model choices flip the results of the same dataset." },
    ],
    evidence: [
      [0, 0, "SUPPORTS", "Direction and timing fit the claim, though the effect is small."],
      [0, 1, "CHALLENGES", "Most of the effect disappears after controlling for sleep."],
      [1, 1, "SUPPORTS", "Sleep absorbs much of the association."],
      [0, 2, "CONTEXT", "Good primer before reading the papers."],
    ],
    notes: ["Check whether sleep is a confounder in the cohort study too.", "Ask: are there any experiments, not just surveys?"],
    comments: [{ on: ["source", 1], by: "peer", text: "This is the strongest source on the board so far." }],
  },
  {
    title: "Do AI coding assistants make developers faster?",
    description: "Separating vendor claims from measured results on AI pair programmers.",
    topic: "AI",
    claims: [
      { title: "AI assistants make developers complete tasks faster", tags: ["ai", "developer-productivity"], status: "VERIFIED" },
      { title: "Speed gains come with more bugs in the shipped code", tags: ["quality"] },
    ],
    sources: [
      { title: "Controlled experiment: building an HTTP server with and without an assistant", sourceType: "Paper", summary: "The assisted group finished a well-defined task noticeably faster." },
      { title: "Code review study of AI-assisted pull requests", sourceType: "Paper", summary: "Mixed: more churn in some repos, no difference in others." },
      { title: "Developer survey on day-to-day assistant use", sourceType: "Article", summary: "Developers feel faster on boilerplate and slower when debugging generated code." },
    ],
    evidence: [
      [0, 0, "SUPPORTS", "Clear speedup on a scoped task."],
      [0, 2, "CONTEXT", "Self-reported, but shows where the gains are felt."],
      [1, 1, "CHALLENGES", "Quality results are mixed, not clearly worse."],
    ],
    notes: ["Task type matters a lot. Greenfield boilerplate vs. debugging legacy code look very different."],
    comments: [{ on: ["claim", 1], by: "demo", text: "Need a study that follows code into production incidents." }],
  },
];

async function upsertUser(email: string, name: string, username: string, bio: string, password: string) {
  const hashed = await bcrypt.hash(password, 10);
  return User.findOneAndUpdate(
    { email },
    { $set: { name, username, bio, password: hashed } },
    { upsert: true, returnDocument: "after" }
  );
}

async function main() {
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("Set SEED_DEMO_PASSWORD (8+ characters) in .env.local before seeding.");
  }

  await connectToDatabase();

  // Earlier versions of this script used @warrant.dev accounts; retire them.
  const legacy = await User.find({ email: { $in: ["demo@warrant.dev", "sam@warrant.dev"] } }).select("_id");
  const legacyIds = legacy.map((u) => u._id);

  // Retire them first: they hold the usernames the new accounts need.
  if (legacyIds.length) {
    const legacyBoards = (await Board.find({ owner: { $in: legacyIds } }).select("_id")).map((b) => b._id);
    await Promise.all(
      [Claim, Source, Evidence, Note, Comment, Activity].map((m) => (m as mongoose.Model<unknown>).deleteMany({ boardId: { $in: legacyBoards } }))
    );
    await Board.deleteMany({ _id: { $in: legacyBoards } });
    await User.deleteMany({ _id: { $in: legacyIds } });
  }

  const demo = await upsertUser("demo@warrant.dev", "Demo Researcher", "demo", "Exploring questions in public on Warrant.", password);
  const peer = await upsertUser("sam@warrant.dev", "Sam Rivera", "sam_rivera", "Reviewer on the demo boards.", password);

  // Clean out previous demo content.
  const oldBoards = await Board.find({ owner: demo._id }).select("_id");
  const oldIds = oldBoards.map((b) => b._id);
  await Promise.all(
    [Claim, Source, Evidence, Note, Comment, Activity].map((m) => (m as mongoose.Model<unknown>).deleteMany({ boardId: { $in: oldIds } }))
  );
  await Board.deleteMany({ _id: { $in: oldIds } });

  for (const seed of BOARDS) {
    const board = await Board.create({
      title: seed.title,
      description: seed.description,
      topic: seed.topic,
      isPublic: true,
      owner: demo._id,
      members: [{ user: peer._id, role: "commenter" }],
    });

    const claims = await Claim.insertMany(
      seed.claims.map((c, i) => ({ ...c, boardId: board._id, author: demo._id, position: { x: 80 + i * 420, y: 0 } }))
    );
    const sources = await Source.insertMany(
      seed.sources.map((s, i) => ({ ...s, boardId: board._id, author: demo._id, position: { x: i * 300, y: 320 } }))
    );
    await Evidence.insertMany(
      seed.evidence.map(([c, s, relationship, explanation]) => ({
        boardId: board._id,
        claimId: claims[c]._id,
        sourceId: sources[s]._id,
        relationship,
        explanation,
        author: demo._id,
      }))
    );
    await Note.insertMany(
      seed.notes.map((content, i) => ({ boardId: board._id, content, author: demo._id, position: { x: 960, y: -20 + i * 190 } }))
    );
    await Comment.insertMany(
      seed.comments.map((c) => ({
        boardId: board._id,
        targetType: c.on[0],
        targetId: (c.on[0] === "claim" ? claims : sources)[c.on[1]]._id,
        author: c.by === "demo" ? demo._id : peer._id,
        content: c.text,
      }))
    );
    await Activity.insertMany([
      { boardId: board._id, actor: demo._id, verb: "created_board", targetType: "board", targetTitle: board.title },
      ...claims.map((c) => ({ boardId: board._id, actor: demo._id, verb: "added", targetType: "claim", targetTitle: c.title })),
      ...sources.map((s) => ({ boardId: board._id, actor: demo._id, verb: "added", targetType: "source", targetTitle: s.title })),
    ]);

    console.log(`  seeded "${board.title}"`);
  }

  console.log(`Done. Log in as demo@warrant.dev with SEED_DEMO_PASSWORD.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
