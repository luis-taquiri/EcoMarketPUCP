"use client";
import { useState } from "react";
import {
  SlidersHorizontal,
  LayoutGrid,
  Notebook,
  BookOpen,
  PencilRuler,
  Heart,
  Sprout,
} from "lucide-react";
import { CATEGORIES, FACULTIES } from "@/lib/constants";
import Link from "next/link";
export function CatalogFilters({
  category,
  faculty,
  kind,
  q,
  counts,
}: {
  category: string;
  faculty: string;
  kind: string;
  q: string;
  counts: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const icons = [Notebook, BookOpen, PencilRuler, LayoutGrid, LayoutGrid];
  return (
    <aside className="filters">
      <button
        className="filter-toggle btn secondary"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <SlidersHorizontal size={18} />
        Filtros
      </button>
      <form action="/explorar" className={open ? "filter-form open" : "filter-form"}>
        <div className="filter-heading">
          <strong>
            <SlidersHorizontal size={18} /> Filtros
          </strong>
          <Link href="/explorar">Limpiar</Link>
        </div>
        <input type="hidden" name="q" value={q} />
        <fieldset>
          <legend>Categorías</legend>
          <label className={`category-option ${!category ? "selected" : ""}`}>
            <input type="radio" name="category" value="" defaultChecked={!category} />
            <LayoutGrid size={16} />
            <span>Todos los materiales</span>
            <small>{counts.total || 0}</small>
          </label>
          {CATEGORIES.map((c, i) => {
            const Icon = icons[i];
            return (
              <label className={`category-option ${category === c ? "selected" : ""}`} key={c}>
                <input type="radio" name="category" value={c} defaultChecked={category === c} />
                <Icon size={16} />
                <span>{c}</span>
                <small>{counts[c] || 0}</small>
              </label>
            );
          })}
        </fieldset>
        <label>
          Facultad
          <select name="faculty" defaultValue={faculty}>
            <option value="">Todas las facultades</option>
            {FACULTIES.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Tipo de intercambio</legend>
          {[
            ["", "Todos"],
            ["TRADE", "Trueque"],
            ["DONATION", "Donación gratuita"],
          ].map(([v, l]) => (
            <label className="radio-line" key={v}>
              <input type="radio" name="kind" value={v} defaultChecked={kind === v} />
              {l}
            </label>
          ))}
        </fieldset>
        <button className="btn soft" type="submit">
          Aplicar filtros
        </button>
        <div className="eco-note">
          <Sprout size={26} />
          <strong>Cada intercambio suma</strong>
          <p>Lo que ya no usas puede acompañar a alguien más durante su carrera.</p>
          <Heart size={17} />
        </div>
      </form>
    </aside>
  );
}
