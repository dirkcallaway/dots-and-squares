import { GamePage } from "@/components/GamePage";

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <GamePage code={code.toUpperCase()} />;
}
