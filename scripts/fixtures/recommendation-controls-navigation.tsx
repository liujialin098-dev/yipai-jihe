const router = {
  push: (path: string) => sessionStorage.setItem("fixture-navigation", path),
};
export function useRouter() {
  return router;
}
export function usePathname() {
  return "/recommendations";
}
export function useSearchParams() {
  return new URLSearchParams();
}
