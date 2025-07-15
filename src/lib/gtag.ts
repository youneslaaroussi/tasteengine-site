declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID || '';

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
  user_properties,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
  user_properties?: Record<string, any>;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      custom_map: user_properties,
    });
  }
};

// Travel-specific event tracking utilities
export const trackChatEvent = (action: string, details?: Record<string, any>) => {
  event({
    action,
    category: 'chat',
    label: details?.message_type || 'user_message',
    value: details?.message_length || 0,
    user_properties: {
      session_id: details?.session_id,
      country: details?.country,
      ...details,
    },
  });
};

export const trackPromptCardClick = (promptId: string, promptTitle: string) => {
  event({
    action: 'prompt_card_click',
    category: 'user_engagement',
    label: promptId,
    user_properties: {
      prompt_title: promptTitle,
    },
  });
};

export const trackCountrySelection = (countryCode: string, countryName: string) => {
  event({
    action: 'country_selected',
    category: 'user_preferences',
    label: countryCode,
    user_properties: {
      country_name: countryName,
    },
  });
};

export const trackAuthEvent = (action: 'login_attempt' | 'signup_attempt' | 'modal_open' | 'modal_close', modalType: 'login' | 'signup') => {
  event({
    action,
    category: 'authentication',
    label: modalType,
  });
};

export const trackNavigationEvent = (action: string, element: string) => {
  event({
    action,
    category: 'navigation',
    label: element,
  });
};

export const trackTravelSearch = (searchType: string, query: string, results?: number) => {
  event({
    action: 'travel_search',
    category: 'travel_actions',
    label: searchType,
    value: results,
    user_properties: {
      search_query: query,
    },
  });
};

export const trackToolUsage = (toolName: string, duration?: number) => {
  event({
    action: 'tool_usage',
    category: 'ai_tools',
    label: toolName,
    value: duration,
  });
};

export const trackUserEngagement = (action: string, element: string, duration?: number) => {
  event({
    action,
    category: 'user_engagement',
    label: element,
    value: duration,
  });
};

export const trackChatHistoryEvent = (action: 'load_session' | 'save_session' | 'new_chat' | 'sidebar_open' | 'sidebar_close') => {
  event({
    action,
    category: 'chat_history',
    label: action,
  });
};

export const trackErrorEvent = (error: string, context: string) => {
  event({
    action: 'error',
    category: 'errors',
    label: context,
    user_properties: {
      error_message: error,
    },
  });
};

export const trackPerformanceMetric = (metric: string, value: number, context?: string) => {
  event({
    action: 'performance_metric',
    category: 'performance',
    label: metric,
    value: value,
    user_properties: {
      context,
    },
  });
};

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: window.location.pathname,
    });
  }
};

// Check if GA is loaded
export const isGALoaded = () => {
  return typeof window !== 'undefined' && !!window.gtag && !!GA_TRACKING_ID;
}; 