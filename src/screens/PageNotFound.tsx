import { useNavigate } from "react-router-dom";

export default function PageNotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[92vh] text-center px-4">
      <p className="text-8xl font-black text-gray-100 select-none">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mt-2">Page Not Found</h1>
      <p className="text-gray-500 text-sm mt-2 max-w-xs">
        This area of Teleria doesn't exist — or you don't have the gear to reach it yet.
      </p>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="btn-primary mt-6 px-6"
      >
        Back to Home
      </button>
    </div>
  );
}
