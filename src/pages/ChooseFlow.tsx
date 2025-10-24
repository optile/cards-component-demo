import { Link } from "react-router-dom";

const ChooseFlow = () => {
  return (
    <div className="flex flex-col space-y-4 h-screen justify-center items-center">
      <div className="flex flex-col space-y-6 p-8 border rounded-lg shadow-lg bg-white">
        <h1 className="text-2xl font-bold text-center">Choose Checkout Flow</h1>
        <Link
          to="/embedded"
          className="px-6 py-3 bg-blue-600 text-white rounded-md text-center hover:bg-blue-700 transition"
        >
          Embedded Checkout Flow
        </Link>
        <Link
          to="/hosted"
          className="px-6 py-3 bg-green-600 text-white rounded-md text-center hover:bg-green-700 transition"
        >
          Hosted Checkout Flow
        </Link>
      </div>
    </div>
  );
};

export default ChooseFlow;
