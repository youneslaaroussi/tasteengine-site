import { motion } from "motion/react";
import { useMemo } from "react";
import Markdown from "react-markdown";
import typewriterHook from "../functions/typewriterHook";
import { MarkdownTypewriterProps } from "../interfaces";

export default function MarkdownTypewriter(props: MarkdownTypewriterProps) {
    const { delay = 10, children: text, motionProps = {}, components: externalComponents, isStreaming = false, ...rest } = props;
    const { characterVariants, onCharacterAnimationComplete, ...restMotionProps } = motionProps;
    
    // Add logging for content changes
    console.log(`[MarkdownTypewriter] Content changed: "${typeof text === "string" ? text.substring(0, 50) : text}..." (${typeof text === "string" ? text.length : 0} chars), isStreaming: ${isStreaming}`);
    
    const { sentenceVariants, components } = typewriterHook({
        delay,
        characterVariants,
        onCharacterAnimationComplete,
        isStreaming,
    });

    const mergedComponents = useMemo(
        () => ({
            ...components,
            ...(externalComponents || {}),
        }),
        [components, externalComponents]
    );

    // Only use a key for non-streaming content to prevent remounts during streaming
    const key = useMemo(() => {
        if (isStreaming) {
            console.log(`[MarkdownTypewriter] Using static key for streaming`);
            return 'streaming-typewriter'; // Static key for streaming
        }
        const dynamicKey = `typewriter-${typeof text === "string" ? text.slice(0, 32) : ""}`;
        console.log(`[MarkdownTypewriter] Using dynamic key: ${dynamicKey}`);
        return dynamicKey;
    }, [isStreaming, text]);

    return (
        <motion.span 
            key={key} 
            variants={sentenceVariants} 
            initial='hidden' 
            animate='visible' 
            onAnimationStart={() => console.log(`[MarkdownTypewriter] Sentence animation started for key: ${key}`)}
            onAnimationComplete={() => console.log(`[MarkdownTypewriter] Sentence animation complete for key: ${key}`)}
            {...restMotionProps}
        >
            <Markdown {...rest} components={mergedComponents}>
                {text}
            </Markdown>
        </motion.span>
    );
}
