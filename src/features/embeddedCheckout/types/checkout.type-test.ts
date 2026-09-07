/**
 * Compile-time contract test for the demo's SDK-derived types. Checked by `tsc -b` (this file is not
 * a test-runner glob and runs nothing at runtime). It fails to compile when the demo's aliases stop
 * matching `@payoneer/checkout-web`, or when the express surface the demo depends on is
 * removed / renamed / retyped upstream - the drift alarm the hand-mirror never had.
 */
import type {
  CheckoutInstance,
  CheckoutInstanceConfig,
  ComponentListDiff,
  DropInComponent,
  ExpressDropInComponent,
  ExpressDropInProps,
  NetworkInformation,
  OnReadyHandler,
  PaymentMethod,
  ReadyEventData,
} from "./checkout";
import type {
  Checkout,
  CheckoutConfigurationProps,
  DropIn,
  ExpressDropIn,
  ExpressDropInConfig,
  OnComponentListChangeCallback,
  OnReadyCallback,
  OnSubmitErrorCallback,
  OnSubmitSuccessCallback,
  TAvailableDropInComponent,
  TReadyEventData,
} from "@payoneer/checkout-web";
import type {
  ExpressOperationType,
  OnSubmitError,
  OnSubmitSuccess,
  WalletMode,
  WalletVisibility,
} from "@/features/expressCheckout/types/express";

/** Fails to compile unless `T` is exactly `true`. */
type Expect<T extends true> = T;

/** Structural type equality (both directions). */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// 1) The demo aliases ARE the SDK public types (no independent re-declaration).
export type _Instance = Expect<Equals<CheckoutInstance, Checkout>>;
export type _DropIn = Expect<Equals<DropInComponent, DropIn>>;
export type _ExpressHandle = Expect<Equals<ExpressDropInComponent, ExpressDropIn>>;
export type _ExpressProps = Expect<Equals<ExpressDropInProps, ExpressDropInConfig>>;
export type _Method = Expect<Equals<PaymentMethod, TAvailableDropInComponent>>;
export type _Ready = Expect<Equals<ReadyEventData, TReadyEventData>>;
export type _Config = Expect<Equals<CheckoutInstanceConfig, CheckoutConfigurationProps>>;
export type _OnReady = Expect<Equals<OnReadyHandler, OnReadyCallback>>;
export type _NetworkInfo = Expect<
  Equals<NetworkInformation, TAvailableDropInComponent["networkInformation"][number]>
>;
export type _ListDiff = Expect<Equals<ComponentListDiff, Parameters<OnComponentListChangeCallback>[1]>>;
export type _OnSubmitSuccess = Expect<Equals<OnSubmitSuccess, OnSubmitSuccessCallback>>;
export type _OnSubmitError = Expect<Equals<OnSubmitError, OnSubmitErrorCallback>>;

// 1b) The demo's runtime `as const` enums (used for the config-sheet dropdowns, so they cannot be
// type-only aliases) stay in lockstep with the SDK config's accepted values. This is the drift alarm
// for the express.ts "Mirrors the SDK's enums" constants.
export type _WalletMode = Expect<Equals<WalletMode, NonNullable<CheckoutInstanceConfig["walletMode"]>>>;
export type _WalletVisibility = Expect<
  Equals<WalletVisibility, NonNullable<NonNullable<CheckoutInstanceConfig["expressWallets"]>["applePay"]>>
>;
export type _ExpressOperationType = Expect<
  Equals<ExpressOperationType, NonNullable<CheckoutInstanceConfig["expressOperationType"]>>
>;

// 2) Pin the express-surface assumptions the demo depends on.
export type _PaymentReferenceRequired = Expect<
  undefined extends ExpressDropInProps["paymentReference"] ? false : true
>;
export type _TransactionIdRequired = Expect<
  undefined extends ExpressDropInProps["transactionId"] ? false : true
>;

type Rate = NonNullable<ExpressDropInProps["shipping"]>["rates"][number];
type Product = NonNullable<ExpressDropInProps["products"]>[number];
export type _RateAmountIsString = Expect<Equals<Rate["amount"], string>>;
export type _ProductAmountIsString = Expect<Equals<Product["amount"], string>>;

// Express identity is declared on the init config (S17 relocation off the drop-in call).
export type _ConfigHasClientId = Expect<"clientId" extends keyof CheckoutInstanceConfig ? true : false>;
export type _ConfigHasCountry = Expect<"country" extends keyof CheckoutInstanceConfig ? true : false>;
