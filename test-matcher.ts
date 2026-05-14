import { getStaticEventDescription } from './src/modules/economic-calendar/utils/eventDescriptions';

const testTitles = [
    "Natural Gas Storage",
    "Non-Farm Employment Change",
    "CPI m/m",
    "Fed Funds Rate"
];

testTitles.forEach(title => {
    const res = getStaticEventDescription(title);
    console.log(`Title: "${title}" -> ${res ? 'MATCHED: ' + res.description.slice(0, 30) + '...' : 'FAILED'}`);
});
