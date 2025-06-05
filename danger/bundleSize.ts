const path = require('path');

export const SIGNIFICANT_THRESHOLD = 0.05;
export const CRITICAL_THRESHOLD = 0.1;

export enum Outcome {
  Critical = 'Critical',
  Significant = 'Significant',
  Ok = 'Ok',
  Indifferent = 'Indifferent',
}

type Result = {
  name: string;
  change: string;
  main: string;
  current: string;
  decimal?: number;
  outcome: Outcome;
};

export function bundleSizeDiff() {
  const mainBundleSize = getFile('artifacts/mainBundleSize.json');
  const currentBundleSize = getFile('artifacts/currentBundleSize.json');

  const mainBundle = normalize(mainBundleSize);
  const currentBundle = normalize(currentBundleSize);
  let scriptResults: Result[] = [];

  currentBundle.scripts.forEach(({ name, size }) => {
    const mainModule = mainBundle.scripts.find((module) => module.name === name);
    const decimal = mainModule ? (size - mainModule.size) / mainModule.size : 0;
    const change = mainModule ? percentChange(decimal) : 'New file';

    const main = mainModule ? kbs(mainModule.size) : '-';
    const current = kbs(size);
    const outcome = getOutcome(decimal, name);

    scriptResults.push({ name, change, main, current, decimal, outcome });
  });

  const deletedScripts = mainBundle.scripts.filter(
    (asset) => !currentBundle.scripts.find(({ name }) => name === asset.name)
  );

  deletedScripts.forEach(({ name, size }) => {
    const change = 'Deleted file';
    const main = kbs(size);
    const current = '-';
    const outcome = Outcome.Indifferent;

    scriptResults.push({ name, change, main, current, outcome });
  });

  const totals = {
    all: getTotals(mainBundle.all, currentBundle.all, 'All'),
    scripts: getTotals(mainBundle.scripts, currentBundle.scripts, 'Scripts'),
    otherAssets: getTotals(mainBundle.otherAssets, currentBundle.otherAssets, 'Non-script Assets'),
  };

  return {
    outcomes: getOutcomes(scriptResults, totals),
    scriptResults,
    totals,
  };
}

function getFile(file) {
  try {
    return require(path.resolve(process.cwd(), file));
  } catch (e) {
    return {
      assets: [],
    };
  }
}

function normalize(statsJson) {
  const hiddenAssets = statsJson.assets.find(isHiddenAssets);
  const otherAssets = { name: 'Other assets', size: hiddenAssets.size };
  const scripts = statsJson.assets
    .filter((asset) => !isHiddenAssets(asset))
    .map((asset) => {
      // remove the hash from name
      const name = `${asset.name.split('.')[0]}.js`;
      const size = asset.size;

      return {
        name,
        size,
      };
    });

  return {
    all: [...scripts, otherAssets],
    scripts,
    otherAssets: [otherAssets],
  };
}

function isHiddenAssets(asset) {
  return asset.type === 'hidden assets';
}

const kilobyteFormatter = new Intl.NumberFormat('en', {
  style: 'unit',
  unit: 'kilobyte',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function kbs(bytes) {
  return kilobyteFormatter.format(bytes / 1000);
}

const percentFormatter = new Intl.NumberFormat('en', {
  style: 'percent',
  signDisplay: 'exceptZero',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function percentChange(decimal: number) {
  if (decimal < 0.0001 && decimal > -0.0001) {
    return '=';
  }

  return percentFormatter.format(decimal);
}

function getOutcome(decimal, name) {
  if (decimal >= CRITICAL_THRESHOLD) {
    return Outcome.Critical;
  }

  if (decimal >= SIGNIFICANT_THRESHOLD) {
    return Outcome.Significant;
  }

  return Outcome.Ok;
}

function getTotals(main, current, name) {
  const mainBundleTotal = main.reduce((acc, { size }) => acc + size, 0);
  const currentBundleTotal = current.reduce((acc, { size }) => acc + size, 0);
  const decimal = (currentBundleTotal - mainBundleTotal) / mainBundleTotal;
  const totalChange = percentChange(decimal);
  const outcome = getOutcome(decimal, 'Total');

  return {
    name,
    main: kbs(mainBundleTotal),
    current: kbs(currentBundleTotal),
    change: totalChange,
    decimal,
    outcome,
  };
}

function getOutcomes(tableResults, totals) {
  const importantScripts = tableResults.filter(({ name }) => ['module.js', 'datasource/module.js'].includes(name));

  return [...importantScripts, totals.scripts].reduce(
    (acc, target) => {
      if (target.outcome === Outcome.Critical) {
        return {
          ...acc,
          critical: [...acc.critical, target],
        };
      }

      if (target.outcome === Outcome.Significant) {
        return {
          ...acc,
          significant: [...acc.significant, target],
        };
      }

      return acc;
    },
    {
      critical: [],
      significant: [],
    }
  );
}
