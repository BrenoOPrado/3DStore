import type { ReactNode } from "react";
import { Printer, ShieldCheck, Truck } from "lucide-react";

export function AboutPage() {
  return (
    <div className="about">
      <p className="eyebrow">Quem somos</p>
      <h1>Sobre nós</h1>
      <p className="about__lead">
        A 3D Store nasceu de um ateliê de impressão. Unimos modelagem, fatiamento e acabamento
        artesanal para criar produtos que parecem saídos de um conceito — porque, de fato,
        cada um começa como um arquivo 3D.
      </p>
      <img
        src="https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=1400&q=80"
        alt="Impressora 3D no ateliê"
        className="about__photo"
      />
      <div className="values">
        <Value
          icon={<Printer className="icon-cyan" />}
          title="Impressão própria"
          text="Produzimos internamente, com revisão peça a peça."
        />
        <Value
          icon={<ShieldCheck className="icon-purple" />}
          title="Qualidade visível"
          text="Camadas controladas, lixamento e pintura quando o design pede."
        />
        <Value
          icon={<Truck className="icon-cyan-bright" />}
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
    <div className="value-card card-surface">
      <div className="value-card__icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
