{
  description = "Muzart development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    (flake-utils.lib.eachDefaultSystem
      (system: nixpkgs.lib.fix (flake:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          packages = {
            codepack = pkgs.corepack;
            direnv = pkgs.nix-direnv;
            nixpkgs-fmt = pkgs.nixpkgs-fmt;
            nodejs = pkgs.nodejs_22;
          };

          devShell = pkgs.mkShell {
            packages = builtins.attrValues flake.packages;
          };
        }
      )));
}
