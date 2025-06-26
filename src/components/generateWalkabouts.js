export const generateWalkaboutBlocks = (mappedEvents = [], startYear = 2000, endYear = 2100) => {
  const walkabouts = [];
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  let current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day >= 1 && day <= 5) {
      const walkStart = new Date(current.setHours(8, 0, 0, 0));
      const walkEnd = new Date(current.setHours(10, 0, 0, 0));
      const now = new Date();

      // Get overlapping sessions
      const overlaps = mappedEvents.filter(event =>
        event.start < walkEnd && event.end > walkStart
      );

      if (overlaps.length === 0) {
        walkabouts.push({
          id: `walkabout-${current.toISOString().slice(0, 10)}-full`,
          title: 'Walkabout',
          start: new Date(walkStart),
          end: new Date(walkEnd),
          location: 'Wards',
          color: '#CCCCCC',
          isWalkabout: true,
          isPast: walkEnd < now
        });
      } else {
        // Sort by start time
        overlaps.sort((a, b) => a.start - b.start);

        let currentStart = new Date(walkStart);

        overlaps.forEach((event, i) => {
          if (event.start > currentStart) {
            walkabouts.push({
              id: `walkabout-${current.toISOString().slice(0, 10)}-${i}`,
              title: 'Walkabout',
              start: new Date(currentStart),
              end: new Date(event.start),
              location: 'Wards',
              color: '#CCCCCC',
              isWalkabout: true,
              isPast: event.start < now
            });
          }
          currentStart = event.end > currentStart ? event.end : currentStart;
        });

        // After last event, if time left till 10am
        if (currentStart < walkEnd) {
          walkabouts.push({
            id: `walkabout-${current.toISOString().slice(0, 10)}-end`,
            title: 'Walkabout',
            start: new Date(currentStart),
            end: new Date(walkEnd),
            location: 'Wards',
            color: '#CCCCCC',
            isWalkabout: true,
            isPast: walkEnd < now
          });
        }
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return walkabouts;
};
