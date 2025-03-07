import { colorManipulator } from '@grafana/data';
import { getTheme } from '@grafana/ui';

export function getColor(color: string, type: `background` | `border` = `background`) {
  const theme = getTheme();

  const redBorderColor = theme.visualization.getColorByName('red');
  const redBackgroundColor = colorManipulator.alpha(redBorderColor, 0.5);

  const greenBorderColor = theme.visualization.getColorByName('green');
  const greenBackgroundColor = colorManipulator.alpha(greenBorderColor, 0.5);

  return color === 'red' ? (type === 'background' ? redBackgroundColor : redBorderColor) : greenBackgroundColor;
}
