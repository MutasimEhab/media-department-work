import React from 'react';

export interface TimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  author?: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events, className = '' }) => {
  return (
    <div className={`relative flex flex-col gap-6 ps-6 sm:ps-8 ${className}`}>
      {/* Vertical line connecting events */}
      <div className="absolute top-2 bottom-2 start-2.5 sm:start-3.5 w-0.5 bg-brand-border" />

      {events.map((event) => (
        <div key={event.id} className="relative flex items-start gap-4">
          {/* Timeline node icon */}
          <div className="absolute -start-6 sm:-start-8 top-0.5 w-6 h-6 rounded-full bg-white border-2 border-brand-plum flex items-center justify-center text-brand-plum z-10 shadow-sm">
            {event.icon || <div className="w-2 h-2 rounded-full bg-brand-plum" />}
          </div>

          <div className="flex flex-col gap-0.5 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-subheading text-brand-darkText">{event.title}</span>
              <span className="text-xs text-brand-charcoal/60 font-mono" dir="ltr">
                {event.timestamp}
              </span>
            </div>
            {event.author && (
              <span className="text-xs text-brand-magenta font-medium">{event.author}</span>
            )}
            {event.description && (
              <p className="text-xs text-brand-charcoal/80 mt-1 leading-relaxed">{event.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
