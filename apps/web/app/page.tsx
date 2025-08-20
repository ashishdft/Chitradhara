export default function Home() {
  return (
    <main className="flex flex-col items-center gap-6 mt-20">
      <h1 className="text-4xl font-bold text-center text-indigo-600">
        Welcome to Chitradhara 🎥
      </h1>
      <p className="text-lg text-gray-700 text-center max-w-xl">
        A modern video platform for creators and communities. Upload, share, and connect with the world.
      </p>
      <a
        href="https://github.com/ashishdft/Chitradhara"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        View on GitHub
      </a>
    </main>
  );
}
