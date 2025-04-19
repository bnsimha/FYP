import TerrainViewer from "@/components/terrain/TerrainViewer";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <div className="flex-1 relative">
        <TerrainViewer />
      </div>
    </main>
  );
}