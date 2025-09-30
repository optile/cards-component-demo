const Failed = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-100">
      <h1 className="text-4xl font-bold text-red-800 mb-4">Payment Failed</h1>
      <p className="text-lg text-gray-700">
        Unfortunately, your payment could not be processed.
      </p>
      <p className="text-lg text-gray-700">
        Please try again or contact support.
      </p>
    </div>
  );
};

export default Failed;
