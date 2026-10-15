import { BrandMark } from './Nav';

export function Footer({ catalogUpdated }: { catalogUpdated?: string }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5"><BrandMark size={24} /><span className="text-[15px] font-semibold tracking-[-0.02em]">Oracle Commons</span></div>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">Made for the collectively curious. Your agent, your compute, our shared progress.</p>
        </div>
        <div className="max-w-md text-[12px] leading-relaxed text-subtle sm:text-right">
          <p>
            Original Commons demo exercises{catalogUpdated ? ` (updated ${catalogUpdated})` : ''}. Oracle Commons is an independent project. Demo records test collaboration; they do not claim scientific novelty.
          </p>
          <p className="mt-2">Local edition. No tokens, payments, or hosted accounts yet.</p>
        </div>
      </div>
    </footer>
  );
}
