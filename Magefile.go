//go:build mage
// +build mage

package main

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/magefile/mage/mg"
	"github.com/magefile/mage/sh"

	// mage:import
	build "github.com/grafana/grafana-plugin-sdk-go/build"
)

// Default configures the default target.
var Default = build.BuildAll

// goPkgs is the package pattern for every Go package we own. Do not widen this
// to ./...: node_modules contains Go files that make golangci-lint fail with
// unactionable errors.
//
// Note that CI is *not* scoped this way. The shared plugin CI workflow runs
// `golangci-lint run --timeout=5m` with no package argument, which defaults to
// ./..., and it does so in the same job after the frontend action has already
// installed node_modules:
// https://github.com/grafana/plugin-ci-workflows/blob/main/actions/internal/plugins/backend/action.yml
//
// What keeps CI green is the `paths` exclusion list in .golangci.yaml, not the
// scope. That entry is load-bearing; deleting it breaks CI even though local
// runs would still pass.
const goPkgs = "./pkg/..."

// Go groups the checks that keep the plugin backend consistent with the rest of
// Synthetic Monitoring. The SDK's imported targets (lint, test, testRace,
// buildAll, ...) occupy the top-level namespace, so these live under `go:`.
type Go mg.Namespace

// Lint runs go vet and golangci-lint over the backend. It is deliberately
// narrower than CI (see goPkgs), so a clean run here is necessary but not
// sufficient; it uses the same .golangci.yaml, so linter findings match.
func (Go) Lint() error {
	fmt.Println("lint via go vet")

	if err := sh.RunV("go", "vet", goPkgs); err != nil {
		return err
	}

	fmt.Println("lint via golangci-lint")

	return sh.RunV("golangci-lint", "run", "--timeout=5m", goPkgs)
}

// Tidy downloads, verifies and tidies the Go module dependencies.
func (Go) Tidy() error {
	goVersion, err := goModVersion()
	if err != nil {
		return err
	}

	if err := sh.RunV("go", "mod", "download"); err != nil {
		return err
	}

	if err := sh.RunV("go", "mod", "verify"); err != nil {
		return err
	}

	return sh.RunV("go", "mod", "tidy", "-compat="+goVersion)
}

// VerifyVersion checks that the Go version in go.mod matches the toolchain in
// use, so that local builds and CI builds cannot silently diverge.
func (Go) VerifyVersion() error {
	modVersion, err := goModVersion()
	if err != nil {
		return err
	}

	rawToolchain, err := sh.Output("go", "env", "GOVERSION")
	if err != nil {
		return fmt.Errorf("reading toolchain version: %w", err)
	}

	toolchain := normalizeGoVersion(rawToolchain)
	if modVersion != toolchain {
		return fmt.Errorf(
			"go version mismatch: go.mod specifies %s, but toolchain is %s",
			modVersion, toolchain,
		)
	}

	fmt.Printf("go version %s matches go.mod\n", toolchain)

	return nil
}

// DetectSchemaDrift regenerates the query-type schema files Grafana serves
// under src/datasource/schema and fails if that left the working tree dirty.
// Run this after adding or changing a named query and commit the result --
// see pkg/plugin/schema_drift_test.go for what actually regenerates the
// files, and why this doesn't just run as part of `go:test`.
func (Go) DetectSchemaDrift() error {
	if err := sh.RunV("go", "test", "-tags=schemadrift", "-run", "TestUpdateSchema", goPkgs); err != nil {
		return err
	}

	return Go{}.EnforceClean()
}

// EnforceClean fails if files that updates can change (go.mod, go.sum) contain
// uncommitted modifications. Typical usage is calling this after a CI step that
// could produce such changes, e.g. `mage go:tidy`.
func (Go) EnforceClean() error {
	for _, path := range []string{"go.mod", "go.sum"} {
		out, err := sh.Output("git", "status", "--porcelain", "--", path)
		if err != nil {
			return fmt.Errorf("checking %s: %w", path, err)
		}

		if out != "" {
			return fmt.Errorf("%s contains changes:\n%s", path, out)
		}
	}

	// Catch anything else that dirties the tree, e.g. untracked files left in
	// the workspace by CI actions.
	out, err := sh.Output("git", "status", "--porcelain")
	if err != nil {
		return fmt.Errorf("checking working tree: %w", err)
	}

	if out != "" {
		return fmt.Errorf("working tree contains changes:\n%s", out)
	}

	fmt.Println("working tree is clean")

	return nil
}

// goModVersion returns the version in the `go` directive of go.mod.
func goModVersion() (string, error) {
	out, err := sh.Output("go", "mod", "edit", "-json")
	if err != nil {
		return "", fmt.Errorf("reading go.mod: %w", err)
	}

	var mod struct {
		Go string `json:"Go"`
	}

	if err := json.Unmarshal([]byte(out), &mod); err != nil {
		return "", fmt.Errorf("parsing go.mod: %w", err)
	}

	if mod.Go == "" {
		return "", fmt.Errorf("go.mod has no go directive")
	}

	return normalizeGoVersion(mod.Go), nil
}

// goVersionRE matches the leading version number of a Go version string,
// including any rc/beta qualifier.
var goVersionRE = regexp.MustCompile(`^[0-9]+(\.[0-9]+)*([a-z]+[0-9]+)?`)

// normalizeGoVersion strips the `go` prefix and any build suffix from a Go
// version string. Distribution-patched toolchains append such a suffix, e.g.
// `go1.26.5-X:nodwarf5` on Arch Linux, which would otherwise never compare
// equal to the plain version in go.mod.
func normalizeGoVersion(version string) string {
	return goVersionRE.FindString(strings.TrimPrefix(strings.TrimSpace(version), "go"))
}
