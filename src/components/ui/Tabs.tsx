import React, { useState } from "react";

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
}

const Tabs: React.FC<TabsProps> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full relative">
      <div className="flex border-b border-gray-200 sticky">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === index
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-y-auto ">
        <div className="max-w-4xl mx-auto">{tabs[activeTab].content}</div>
      </div>
    </div>
  );
};

export default Tabs;
