'use strict';

exports.__esModule = true;
exports.endOfRange = endOfRange;
exports.eventSegments = eventSegments;
exports.singleDayPinSegments = singleDayPinSegments;
exports.singleDayEventSegments = singleDayEventSegments;
exports.eventLevels = eventLevels;
exports.inRange = inRange;
exports.segsOverlap = segsOverlap;
exports.sortEvents = sortEvents;

var _findIndex = require('lodash/findIndex');

var _findIndex2 = _interopRequireDefault(_findIndex);

var _dates = require('./dates');

var _dates2 = _interopRequireDefault(_dates);

var _accessors = require('./accessors');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function endOfRange(dateRange) {
  var unit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'day';

  return {
    first: dateRange[0],
    last: _dates2.default.add(dateRange[dateRange.length - 1], 1, unit)
  };
}

function eventSegments(event, first, last, _ref, range) {
  var startAccessor = _ref.startAccessor,
      endAccessor = _ref.endAccessor;

  var slots = _dates2.default.diff(first, last, 'day');
  var start = _dates2.default.max(_dates2.default.startOf((0, _accessors.accessor)(event, startAccessor), 'day'), first);
  var end = _dates2.default.min(_dates2.default.ceil((0, _accessors.accessor)(event, endAccessor), 'day'), last);
  var padding = (0, _findIndex2.default)(range, function (x) {
    return _dates2.default.eq(x, start, 'day');
  });
  var span = _dates2.default.diff(start, end, 'day');
  span = Math.min(span, slots);
  span = Math.max(span, 1);

  return {
    event: event,
    span: span,
    left: padding + 1,
    right: Math.max(padding + span, 1)
  };
}

function singleDayPinSegments(event, first, last, _ref2, timeRange) {
  var startAccessor = _ref2.startAccessor;

  var eStart = (0, _accessors.accessor)(event, startAccessor);
  var eStartHour = _dates2.default.hours(eStart);
  var eStartMin = _dates2.default.minutes(eStart);

  var _dates$roundMins = _dates2.default.roundMins(eStartMin, null),
      roundStartMins = _dates$roundMins.roundStartMins;

  var hourMins = eStartHour + roundStartMins / 60;
  if (hourMins === 24) {
    hourMins = 23.75;
  }
  var padding = (0, _findIndex2.default)(timeRange, function (x) {
    return x === hourMins;
  });
  var spanMin = 30 / 15;
  var span = spanMin;
  return {
    event: event,
    span: span,
    left: padding + 1,
    right: Math.max(padding + span, 1)
  };
}

function singleDayEventSegments(event, first, last, _ref3, timeRange) {
  var startAccessor = _ref3.startAccessor,
      endAccessor = _ref3.endAccessor;

  var slots = timeRange.length;
  var start = _dates2.default.max(_dates2.default.startOf((0, _accessors.accessor)(event, startAccessor), 'hours'), first);
  var end = _dates2.default.min(_dates2.default.startOf((0, _accessors.accessor)(event, endAccessor), 'hours'), last);
  var eStart = (0, _accessors.accessor)(event, startAccessor);
  var eEnd = (0, _accessors.accessor)(event, endAccessor);
  var eStartHour = _dates2.default.hours(eStart);
  var eStartMin = _dates2.default.minutes(eStart);
  var eEndMin = _dates2.default.minutes(eEnd);

  var _dates$roundMins2 = _dates2.default.roundMins(eStartMin, eEndMin),
      roundStartMins = _dates$roundMins2.roundStartMins,
      roundEndMins = _dates$roundMins2.roundEndMins;

  var hourMins = eStartHour + roundStartMins / 60;
  var padding = (0, _findIndex2.default)(timeRange, function (x) {
    return x === hourMins;
  });
  var spanHour = _dates2.default.diff(start, end, 'hours') * 4;
  var spanMin = (roundEndMins - roundStartMins) / 15;
  spanHour = Math.min(spanHour, slots);
  spanHour = Math.max(spanHour, 0);
  var span = spanHour + spanMin;
  return {
    event: event,
    span: span,
    left: padding + 1,
    right: Math.max(padding + span, 1)
  };
}

function eventLevels(rowSegments) {
  var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Infinity;

  var i = void 0,
      j = void 0,
      seg = void 0,
      levels = [],
      extra = [];

  for (i = 0; i < rowSegments.length; i++) {
    seg = rowSegments[i];

    for (j = 0; j < levels.length; j++) {
      if (!segsOverlap(seg, levels[j])) break;
    }if (j >= limit) {
      extra.push(seg);
    } else {
      ;(levels[j] || (levels[j] = [])).push(seg);
    }
  }

  for (i = 0; i < levels.length; i++) {
    levels[i].sort(function (a, b) {
      return a.left - b.left;
    }); //eslint-disable-line
  }

  return { levels: levels, extra: extra };
}

function inRange(e, start, end, _ref4) {
  var startAccessor = _ref4.startAccessor,
      endAccessor = _ref4.endAccessor;

  var eStart = _dates2.default.startOf((0, _accessors.accessor)(e, startAccessor), 'day');
  var eEnd = (0, _accessors.accessor)(e, endAccessor);

  var startsBeforeEnd = _dates2.default.lte(eStart, end, 'day');
  // when the event is zero duration we need to handle a bit differently
  var endsAfterStart = !_dates2.default.eq(eStart, eEnd, 'minutes') ? _dates2.default.gt(eEnd, start, 'minutes') : _dates2.default.gte(eEnd, start, 'minutes');

  return startsBeforeEnd && endsAfterStart;
}

function segsOverlap(seg, otherSegs) {
  return otherSegs.some(function (otherSeg) {
    return otherSeg.left <= seg.right && otherSeg.right >= seg.left;
  });
}

function sortEvents(evtA, evtB, _ref5) {
  var startAccessor = _ref5.startAccessor,
      endAccessor = _ref5.endAccessor,
      allDayAccessor = _ref5.allDayAccessor;

  var startSort = +_dates2.default.startOf((0, _accessors.accessor)(evtA, startAccessor), 'day') - +_dates2.default.startOf((0, _accessors.accessor)(evtB, startAccessor), 'day');

  var durA = _dates2.default.diff((0, _accessors.accessor)(evtA, startAccessor), _dates2.default.ceil((0, _accessors.accessor)(evtA, endAccessor), 'day'), 'day');

  var durB = _dates2.default.diff((0, _accessors.accessor)(evtB, startAccessor), _dates2.default.ceil((0, _accessors.accessor)(evtB, endAccessor), 'day'), 'day');

  return startSort || // sort by start Day first
  Math.max(durB, 1) - Math.max(durA, 1) || // events spanning multiple days go first
  !!(0, _accessors.accessor)(evtB, allDayAccessor) - !!(0, _accessors.accessor)(evtA, allDayAccessor) || // then allDay single day events
  +(0, _accessors.accessor)(evtA, startAccessor) - +(0, _accessors.accessor)(evtB, startAccessor); // then sort by start time
}