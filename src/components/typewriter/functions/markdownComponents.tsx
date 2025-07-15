import htmlTags from "html-tags";
import { ForwardRefComponent, HTMLMotionProps, motion, Variants } from "motion/react";
import { ClassAttributes, ElementType, HTMLAttributes, RefObject } from "react";
import { Components, ExtraProps } from "react-markdown";
import TypewriterItem from "../components/TypewriterItem";

export default function markdownComponents({
    characterVariants,
    onCharacterAnimationComplete,
    delay,
    isStreaming = false,
}: {
    characterVariants: Variants;
    onCharacterAnimationComplete?: (letterRef: RefObject<HTMLSpanElement | null>) => void;
    delay: number;
    isStreaming?: boolean;
}): Components {
    let res: Components = {};
    const sentenceVariants = {
        hidden: characterVariants.hidden,
        visible: {
            ...characterVariants.visible,
            opacity: 1,
            transition: { staggerChildren: delay / 1000 },
        },
    };
    htmlTags.forEach((tag) => {
        try {
            let MotionComponent: ForwardRefComponent<HTMLHeadingElement, HTMLMotionProps<any>> = (motion as any)[tag];
            if (MotionComponent) {
                let fn: ElementType<
                    ClassAttributes<HTMLHeadingElement> & HTMLAttributes<HTMLHeadingElement> & ExtraProps
                > = (props) => {
                    const { children, id, className } = props;
                    const { node, ...componentProps } = props;
                    
                    // Generate a stable key for TypewriterItem
                    let stableKey: string;
                    if (id) {
                        stableKey = id;
                    } else if (isStreaming) {
                        // For streaming, use a static key based on tag and position to prevent remounts
                        stableKey = `${tag}-streaming-item`;
                    } else {
                        // For non-streaming, use content-based key
                        const contentKey = typeof children === 'string' ? children.slice(0, 20).replace(/[^\w]/g, '_') : 'content';
                        stableKey = `${tag}-${contentKey}`;
                    }
                    console.log(`[markdownComponents] Processing ${tag} with id: ${id}, stableKey: ${stableKey}, isStreaming: ${isStreaming}, children:`, typeof children === 'string' ? `"${children.substring(0, 30)}..."` : children);
                    
                    switch (tag) {
                        case "table":
                        case "input":
                        case "hr":
                        case "img":
                            return (
                                <MotionComponent
                                    {...componentProps}
                                    key={`${tag}-${stableKey}`}
                                    variants={className ? undefined : sentenceVariants}
                                    onAnimationComplete={onCharacterAnimationComplete}
                                >
                                    {children}
                                </MotionComponent>
                            );
                        case "tr":
                        case "th":
                        case "td":
                            return <MotionComponent {...componentProps}>{children}</MotionComponent>;
                        case "p":
                            return (
                                <TypewriterItem
                                    key={stableKey}
                                    itemKey={stableKey}
                                    children={children}
                                    characterVariants={characterVariants}
                                    onCharacterAnimationComplete={onCharacterAnimationComplete}
                                    dadElement={(children) => {
                                        if (Array.isArray(children)) {
                                            children.push(
                                                <motion.span
                                                    key={`span-${stableKey}-newline`}
                                                    style={{ display: "block", height: 0, width: 0 }}
                                                />
                                            );
                                            return children;
                                        }
                                        return children;
                                    }}
                                />
                            );
                        case "span":
                            return (
                                <TypewriterItem
                                    key={stableKey}
                                    itemKey={stableKey}
                                    children={children}
                                    characterVariants={characterVariants}
                                    onCharacterAnimationComplete={onCharacterAnimationComplete}
                                    dadElement={(children) => {
                                        if (Array.isArray(children)) {
                                            return (
                                                <MotionComponent
                                                    {...componentProps}
                                                    key={`${tag}-${stableKey}`}
                                                    children={children}
                                                />
                                            );
                                        }
                                        return children;
                                    }}
                                />
                            );
                        default:
                            return (
                                <TypewriterItem
                                    key={stableKey}
                                    itemKey={stableKey}
                                    children={children}
                                    characterVariants={characterVariants}
                                    onCharacterAnimationComplete={onCharacterAnimationComplete}
                                    dadElement={(children, isString) => {
                                        return (
                                            <MotionComponent
                                                {...componentProps}
                                                key={`${tag}-${stableKey}`}
                                                variants={isString || className ? undefined : sentenceVariants}
                                            >
                                                {children}
                                            </MotionComponent>
                                        );
                                    }}
                                />
                            );
                    }
                };
                (res as any)[tag] = fn;
            }
        } catch (_) {}
    });
    return res;
}
