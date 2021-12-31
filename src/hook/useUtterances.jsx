import { useEffect, useState } from 'react';

export const useUtterances = (commentNodeId) => {
    useEffect(() => {
        const scriptParentNode = document.getElementById(commentNodeId);
        if (!scriptParentNode) return;
        // docs - https://utteranc.es/
        const script = document.createElement('script');
        script.src = 'https://utteranc.es/client.js';
        script.async = true;
        script.setAttribute('repo', 'ElijahJunnior/Ignite-reactjs-07-SpaceTraveling');
        script.setAttribute('issue-term', 'pathname');
        script.setAttribute('label', 'Comentar :tada:');
        script.setAttribute('theme', 'photon-dark');
        script.setAttribute('crossorigin', 'anonymous');

        scriptParentNode.appendChild(script);

        return () => {
            // cleanup - remove the older script with previous theme
            scriptParentNode.removeChild(scriptParentNode.firstChild);
        };
    }, [commentNodeId]);
};