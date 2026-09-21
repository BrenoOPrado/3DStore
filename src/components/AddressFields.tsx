import { Field, SelectField } from "./Field";
import { maskCep, maskPhone } from "../data/checkout";
import { addressDefaults, type Address, type AddressKind } from "../data/commerce";
import { RESIDENCE_TYPES, STREET_TYPES } from "../data/customerRules";

export const ADDRESS_KIND_OPTIONS: { value: AddressKind; label: string }[] = [
  { value: "ambos", label: "Cobrança e entrega (ambos)" },
  { value: "cobranca", label: "Cobrança" },
  { value: "entrega", label: "Entrega" },
];

export function emptyAddress(recipient = "", phone = ""): Omit<Address, "id"> {
  const { id, ...rest } = addressDefaults({
    id: "tmp",
    label: "Casa",
    recipient,
    phone,
    kind: "ambos",
  });
  void id;
  return rest;
}

function withoutId(value: Omit<Address, "id"> & { id?: string }): Omit<Address, "id"> {
  const { id, ...rest } = value;
  void id;
  return rest;
}

export function AddressFields({
  value,
  onChange,
}: {
  value: Omit<Address, "id"> & { id?: string };
  onChange: (next: Omit<Address, "id">) => void;
}) {
  const set = <K extends keyof Omit<Address, "id">>(key: K) => (v: string) =>
    onChange({ ...withoutId(value), [key]: v });

  return (
    <div className="form-grid">
      <Field label="Apelido" value={value.label} onChange={set("label")} testId="addr-label" />
      <SelectField
        label="Tipo do endereço"
        value={value.kind}
        onChange={(v) => onChange({ ...withoutId(value), kind: v as AddressKind })}
        options={ADDRESS_KIND_OPTIONS}
        testId="addr-kind"
      />
      <SelectField
        label="Tipo de residência"
        value={value.residenceType}
        onChange={set("residenceType")}
        options={[...RESIDENCE_TYPES]}
        testId="addr-residence-type"
      />
      <SelectField
        label="Tipo de logradouro"
        value={value.streetType}
        onChange={set("streetType")}
        options={[...STREET_TYPES]}
        testId="addr-street-type"
      />
      <Field label="Logradouro" value={value.street} onChange={set("street")} wide testId="addr-street" />
      <Field label="Número" value={value.number} onChange={set("number")} testId="addr-number" />
      <Field
        label="Complemento"
        value={value.complement}
        onChange={set("complement")}
        required={false}
        testId="addr-complement"
      />
      <Field label="Bairro" value={value.neighborhood} onChange={set("neighborhood")} testId="addr-neighborhood" />
      <Field label="CEP" value={value.cep} onChange={(v) => set("cep")(maskCep(v))} testId="addr-cep" />
      <Field label="Cidade" value={value.city} onChange={set("city")} testId="addr-city" />
      <Field label="Estado" value={value.state} onChange={set("state")} testId="addr-state" />
      <Field label="País" value={value.country} onChange={set("country")} testId="addr-country" />
      <Field
        label="Observações"
        value={value.notes}
        onChange={set("notes")}
        required={false}
        wide
        testId="addr-notes"
      />
      <Field label="Destinatário" value={value.recipient} onChange={set("recipient")} testId="addr-recipient" />
      <Field
        label="Telefone do endereço"
        value={value.phone}
        onChange={(v) => set("phone")(maskPhone(v))}
        required={false}
        testId="addr-phone"
      />
    </div>
  );
}
