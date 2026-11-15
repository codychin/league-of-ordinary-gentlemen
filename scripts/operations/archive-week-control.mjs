// Shared with the real navigation suite: nested label text includes the options.
// Scope to the games section so an unrelated Week control cannot satisfy a check.
export async function selectArchiveWeek(games,week) {
 if(!Number.isInteger(Number(week)) || Number(week)<1)throw Error('ARCHIVE_WEEK_INVALID');
 const controls=games.getByRole('combobox',{name:/^Week/});
 if(await controls.count()!==1)throw Error('ARCHIVE_WEEK_CONTROL_AMBIGUOUS');
 await controls.selectOption(String(week));
}
