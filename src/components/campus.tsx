import { Recycle } from "lucide-react";
export function Campus() {
  return (
    <div className="campus-art" aria-hidden="true">
      <div className="building">
        <i />
        <i />
        <i />
        <b>PUCP</b>
      </div>
      <div className="tree t1">
        <i />
        <b />
      </div>
      <div className="tree t2">
        <i />
        <b />
      </div>
      <div className="books">
        <i />
        <i />
        <i />
      </div>
      <div className="recycle-mark">
        <Recycle size={42} />
      </div>
    </div>
  );
}
