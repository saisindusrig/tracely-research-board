import {Button} from "@/components/ui/button"
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-blue-600">
        ResearchBoard is starting! 🚀
      </h1>
      <p className="mt-4 text-gray-600">
        Welcome to your collaborative research platform.
        <Button variant="default">Test shadcn Button</Button>
      </p>
    </main>
  );
}