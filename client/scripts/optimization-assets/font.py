"""Run with fonttools[woff] in a temporary venv; retain all glyphs and variable axes."""
from pathlib import Path
from fontTools.ttLib import TTFont

fonts = Path(__file__).resolve().parents[2] / 'public' / 'fonts'
source = TTFont(fonts / 'Inter-Variable.ttf', recalcTimestamp=False)
source.flavor = 'woff2'
destination = fonts / 'Inter-Variable.woff2'
source.save(destination)
converted = TTFont(destination)
assert source.getBestCmap() == converted.getBestCmap()
assert source.getGlyphOrder() == converted.getGlyphOrder()
axes = lambda font: [(a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in font['fvar'].axes]
assert axes(source) == axes(converted)
print(f'{destination}: {destination.stat().st_size} bytes; cmap, glyphs and axes preserved')
