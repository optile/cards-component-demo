import React from "react";
import type { ReviewSectionProps } from "@/features/hostedCheckout/types/hostedPayment";
import { registrationOptions, Registrations, type RegistrationType } from "@/constants/registrations";

interface ReviewRegistrationSetup extends ReviewSectionProps {
  registrationType: RegistrationType | undefined;
}

const ReviewRegistrationSetup: React.FC<ReviewRegistrationSetup> = ({
  registrationType,
}) => {


  const registration = registrationOptions[registrationType || Registrations.GUEST];
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold text-gray-800 mb-3">Registration type</h3>
      <div className="text-sm">
        <span className="font-medium capitalize"> {registration.title}</span>
        <p className="text-gray-500">
          {registration.note}
        </p>
      </div>
    </div>
  );
};

export default ReviewRegistrationSetup;
