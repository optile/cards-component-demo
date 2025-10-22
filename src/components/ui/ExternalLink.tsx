import React from "react";
import Tooltip from "./Tooltip";
import Icon from "./Icon";

interface ExternalLinkProps {
  iconSize?: number;
  iconClassName?: string;
  tooltipContent?: string;
  link: string;
}

const ExternalLink: React.FC<ExternalLinkProps> = ({
  tooltipContent = "Explore in documentation",
  iconSize = 16,
  iconClassName = "text-gray-500 cursor-help",
  link,
}) => (
  <Tooltip content={tooltipContent}>
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      title={tooltipContent}
      className="inline-flex text-gray-500 cursor-pointer"
    >
      <Icon name="external-link" size={iconSize} className={iconClassName} />
    </a>
  </Tooltip>
);

export default ExternalLink;
