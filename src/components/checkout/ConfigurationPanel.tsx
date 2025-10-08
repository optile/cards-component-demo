import React from "react";
import Tabs from "../ui/Tabs";
import UIStylingTab from "./UIStylingTab";
import MerchantStoreCartTab from "./MerchantStoreCartTab";
import MerchantStoreUserDataTab from "./MerchantStoreUserDataTab";
import SDKBaseConfiguration from "./SDKBaseConfiguration";
import SDKAdvancedConfiguration from "./SDKAdvancedConfiguration";

const ConfigurationPanel: React.FC = () => {
  const tabs = [
    {
      label: "SDK base configuration",
      content: <SDKBaseConfiguration />,
    },
    {
      label: "SDK advanced configuration",
      content: <SDKAdvancedConfiguration />,
    },
    {
      label: "Merchant Store Cart",
      content: <MerchantStoreCartTab />,
    },
    {
      label: "Merchant Store User Data",
      content: <MerchantStoreUserDataTab />,
    },
    {
      label: "UI and Styling",
      content: <UIStylingTab />,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md my-8">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">
        Configuration
      </h2>
      <Tabs tabs={tabs} />
    </div>
  );
};

export default ConfigurationPanel;
