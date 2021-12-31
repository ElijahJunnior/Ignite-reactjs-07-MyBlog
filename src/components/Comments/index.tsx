import React from 'react';
import { useUtterances } from '../../hook/useUtterances';

const commentNodeId = 'comments';

type commentsProps = {
    className?: string
}

export function Comments(props: commentsProps) {
    useUtterances(commentNodeId);
    return <div className={props?.className || ''} id={commentNodeId} />;
};