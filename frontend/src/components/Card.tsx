export default function Card({ children }: { children: React.ReactNode }) {
    return (
      <div className="bg-white rounded-2xl shadow-md px-6 py-6 w-full max-w-md mx-auto">
        {children}
      </div>
    );
  }
  