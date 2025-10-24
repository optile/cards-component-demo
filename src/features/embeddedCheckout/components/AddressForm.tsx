import React from "react";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

interface FormAddress {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  state: string;
  country: string;
  number: string;
  birthday: string;
}

export type { FormAddress as Address };

interface AddressFormProps {
  address: FormAddress;
  onChange: (field: keyof FormAddress, value: string) => void;
  title: string;
  showEmail?: boolean;
}

const countries = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "DE", label: "Germany" },
  { value: "CH", label: "China" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
  { value: "RU", label: "Russia" },
  { value: "AT", label: "Austria" },
  { value: "PL", label: "Poland" },
  { value: "NL", label: "Netherlands" },
  { value: "BE", label: "Belgium" },
  { value: "PT", label: "Portugal" },
  // Add more as needed
];

const AddressForm: React.FC<AddressFormProps> = ({
  address,
  onChange,
  title,
  showEmail = false,
}) => (
  <div>
    <h3 className="text-lg font-medium mb-4">{title}</h3>
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Input
        type="text"
        value={address.firstName}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("firstName", e.target.value)}
        label="First Name"
        id={`${title.toLowerCase().replace(" ", "-")}-first-name`}
      />
      <Input
        type="text"
        value={address.lastName}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("lastName", e.target.value)}
        label="Last Name"
        id={`${title.toLowerCase().replace(" ", "-")}-last-name`}
      />
      {showEmail && (
        <Input
          type="email"
          value={address.email || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("email", e.target.value)}
          label="Email"
          id={`${title.toLowerCase().replace(" ", "-")}-email`}
        />
      )}
      <Input
        type="tel"
        value={address.phone}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("phone", e.target.value)}
        label="Phone"
        id={`${title.toLowerCase().replace(" ", "-")}-phone`}
      />
      <Input
        type="text"
        value={address.street}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("street", e.target.value)}
        label="Street"
        id={`${title.toLowerCase().replace(" ", "-")}-street`}
      />
      <Input
        type="text"
        value={address.houseNumber}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("houseNumber", e.target.value)}
        label="House Number"
        id={`${title.toLowerCase().replace(" ", "-")}-house-number`}
      />
      <Input
        type="text"
        value={address.zip}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("zip", e.target.value)}
        label="ZIP"
        id={`${title.toLowerCase().replace(" ", "-")}-zip`}
      />
      <Input
        type="text"
        value={address.city}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("city", e.target.value)}
        label="City"
        id={`${title.toLowerCase().replace(" ", "-")}-city`}
      />
      <Input
        type="text"
        value={address.state}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("state", e.target.value)}
        label="State"
        id={`${title.toLowerCase().replace(" ", "-")}-state`}
      />
      <Select
        value={address.country}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange("country", e.target.value)}
        options={countries}
        label="Country"
        id={`${title.toLowerCase().replace(" ", "-")}-country`}
      />
    </div>
  </div>
);

export default AddressForm;
