import BrandLogo from './BrandLogo'
    export default function Footer() {
      return (
        <footer className="w-full bg-surface-container-lowest shadow-[0_-1px_8px_rgba(17,24,39,0.03)] mt-space-xl">
          <div className="w-full max-w-[1440px] mx-auto px-4 md:px-margin-desktop py-space-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg pb-space-lg border-b border-surface-container-high/60">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-sm">
                  <BrandLogo size={32} />
                  <span className="font-title-md text-title-md text-on-surface font-bold">Fathalla Healthy Market</span>
                  <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-semibold">Capstone Project</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xl">
                  Helping people who manage diabetes and chronic conditions make safer grocery choices. Nutrition values are approximate and for information only.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-md">
                <div className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-low">
                  <span className="material-symbols-outlined text-primary text-xl">support_agent</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Project</span>
                    <span className="font-metric-label text-metric-label text-on-surface font-bold">Capstone 2026</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-low">
                  <span className="material-symbols-outlined text-tertiary text-xl">verified_user</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Version</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">v1.0</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-space-md flex flex-col md:flex-row items-center justify-between gap-space-md font-body-sm text-body-sm text-on-surface-variant">
              <p>© 2026 Fathalla Healthy Market. Medical Disclaimer: this app is informational only. Always consult your physician before changing your diet or insulin dosage.</p>
              <div className="flex items-center gap-space-lg">
                <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
                <a className="hover:text-primary transition-colors" href="#">Dietary Standards</a>
                <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      );
    }
