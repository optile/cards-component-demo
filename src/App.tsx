import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/global/Header";
import Checkout from "./pages/Checkout";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white dark:bg-gray-800">
        <Header />
        <main className="flex justify-center p-4">
          <Routes>
            <Route path="/" element={<Checkout />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
