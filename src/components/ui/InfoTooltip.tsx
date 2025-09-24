import React from "react";
import Tooltip from "./Tooltip";
import Icon from "./Icon";

interface InfoTooltipProps {
  content: string;
  iconSize?: number;
  iconClassName?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  iconSize = 16,
  iconClassName = "text-gray-500 cursor-help",
}) => {
  return (
    <Tooltip content={content}>
      <Icon name="info" size={iconSize} className={iconClassName} />
    </Tooltip>
  );
};

export default InfoTooltip;
