// apps/web/app/forbidden.tsx
export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-5xl font-bold mb-4">403</h1>
      <p className="text-lg">You are not authorized to view this video.</p>
    </div>
  );
}

