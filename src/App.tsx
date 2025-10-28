import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Header from "@/components/global/Header";
import ChooseFlow from "@/pages/ChooseFlow";
import Checkout from "@/features/embeddedCheckout/pages/Checkout";
import HostedCheckout from "@/features/hostedCheckout/pages/HostedCheckout";

function App() {
  return (
    <Router basename="/">
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
    </Router>
  );
}

export default App;
