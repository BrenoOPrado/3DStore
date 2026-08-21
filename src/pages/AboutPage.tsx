import type { ReactNode } from "react";
import { Printer, ShieldCheck, Truck } from "lucide-react";

export function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-sm text-cyan">Quem somos</p>
      <h1 className="mt-1 text-4xl font-bold">Sobre nós</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted">
        A 3D Store nasceu de um ateliê de impressão. Unimos modelagem, fatiamento
        e acabamento artesanal para criar produtos que parecem saídos de um
        conceito — porque, de fato, cada um começa como um arquivo 3D.
      </p>
      <img
        src="https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=1400&q=80"
        alt="Impressora 3D no ateliê"
        className="mt-10 h-72 w-full rounded-3xl object-cover"
      />
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <Value
          icon={<Printer className="text-cyan" />}
          title="Impressão própria"
          text="Produzimos internamente, com revisão peça a peça."
        />
        <Value
          icon={<ShieldCheck className="text-purple" />}
          title="Qualidade visível"
          text="Camadas controladas, lixamento e pintura quando o design pede."
        />
        <Value
          icon={<Truck className="text-cyan-bright" />}
          title="Envio cuidadoso"
          text="Embalamos como colecionável: proteção, nota e rastreio."
        />
      </div>
    </div>
  );
}

function Value({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="card-surface rounded-2xl p-5">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  );
}
