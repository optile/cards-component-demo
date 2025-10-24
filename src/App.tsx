import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/global/Header";
import ChooseFlow from "./pages/ChooseFlow";
import { Checkout } from "./features/embeddedCheckout";
import { HostedCheckout } from "./features/hostedCheckout";

function App() {
  return (
    <BrowserRouter basename="/cards-component-demo">
      <div className="min-h-screen bg-white dark:bg-gray-800">
        <Header />
        <main className="flex justify-center p-4">
          <Routes>
            <Route path="/" element={<ChooseFlow />} />
            <Route path="/embedded" element={<Checkout />} />
            <Route path="/hosted" element={<HostedCheckout />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
