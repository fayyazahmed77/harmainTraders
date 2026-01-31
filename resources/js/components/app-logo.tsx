import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-10 items-center justify-center rounded-md  text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xl">Harmain</span> <span className="font-semibold text-sidebar-primary text-xl">Traders</span>
            </div>
            <span className="text-xs">Wholesale <span className="text-sidebar-primary">&</span> Supply Chain</span>
          </div>
        </>
    );
}
