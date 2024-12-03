import React from 'react';
import { useStyles2 } from '@grafana/ui';
import {
    SceneComponentProps,
    SceneFlexItem,
    SceneFlexLayout,
    SceneObjectBase,
    SceneObjectState,
} from '@grafana/scenes';
import { getInsightsPanelStyles } from './getInsightsPanelStyles';

interface InsightsState extends SceneObjectState {
    title: string;
    description: string;
    link?: string;
    linkText?: string;
}

export class InsightsItem extends SceneObjectBase<InsightsState> {
    public static Component = InsightsItemRenderer;

    public constructor(state: InsightsState) {
        super(state);
    }
}

function InsightsItemRenderer({ model }: SceneComponentProps<InsightsItem>) {
    const { title, description,  link, linkText} = model.useState();
    const styles = useStyles2(getInsightsPanelStyles);

    return (
        <div className={styles.insight}>
            <h6 className={styles.title}>{title}</h6>
            <p>{description}</p>
            {link && (
                <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: '#639FFF' }}>
                    {linkText || 'Learn more'}
                </a>
            )}
        </div>
    );
}

export function getInsightsItem(title: string, description: string, link: string | undefined, linkText: string | undefined) {
    return new SceneFlexLayout({
        children: [
            new SceneFlexItem({
                body: new InsightsItem({title: title, description: description, link: link, linkText: linkText}),
            }),
        ],
    });
}
