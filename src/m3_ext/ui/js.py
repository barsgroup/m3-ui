# coding:utf-8
"""
Хелперы работы с javascript'ом

Created on 27.05.2010

@author: akvarats
"""

import re


#==============================================================================
# Нормализация js для целей разработки
#==============================================================================
class JSNormalizer(object):

    def normalize(self, script):
        result = ''
        for line in script.splitlines():
            if line.strip():
                result += line + '\n'
        return result


class JSCompressor(object):
    """
    a regex-based JavaScript code compression kludge
    """
    # {{{ http://code.activestate.com/recipes/496882/ (r8)

    def __init__(self, compressionLevel=2, measureCompression=False):
        """
        compressionLevel:
        0 - no compression, script returned unchanged. For debugging only -
            try if you suspect that compression compromises your script
        1 - Strip comments and empty lines, don't change line breaks and
            indentation (code remains readable)
        2 - Additionally strip insignificant whitespace
            (code will become quite unreadable)

        measureCompression: append a comment stating the extent of compression
        """
        self.compressionLevel = compressionLevel
        self.measureCompression = measureCompression

    # a bunch of regexes used in compression
    # first, exempt string and regex literals from compression by transient
    # substitution

    findLiterals = re.compile(r'''
        # single-quoted strings
        (\'.*?(?<=[^\\])\') |
        # double-quoted strings
        (\".*?(?<=[^\\])\") |
        # JS regexes, trying hard not to be tripped up by comments
        ((?<![\*\/])\/(?![\/\*]).*?(?<![\\])\/)
        ''', re.VERBOSE)

    # literals are temporarily replaced by numbered placeholders

    literalMarker = '@_@%d@_@'                  # temporary replacement
    backSubst = re.compile(
        '@_@(\d+)@_@')       # put the string literals back in

    mlc1 = re.compile(r'(\/\*.*?\*\/)')
                      # /* ... */ comments on single line
    mlc = re.compile(r'(\/\*.*?\*\/)', re.DOTALL)  # real multiline comments
    slc = re.compile('\/\/.*')                  # remove single line comments

    collapseWs = re.compile(
        # collapse successive non-leading white space characters into one
        '(?<=\S)[ \t]+')

    squeeze = re.compile(r'''
        # remove whitespace preceding control characters
        \s+(?=[\}\]\)\:\&\|\=\;\,\.\+]) |
        # ... or following such
        (?<=[\{\[\(\:\&\|\=\;\,\.\+])\s+ |
        # remove spaces or tabs preceding non-word characters
        [ \t]+(?=\W) |
        # ... or following such
        (?<=\W)[ \t]+
        ''', re.VERBOSE | re.DOTALL)

    def compress(self, script):
        """
        perform compression and return compressed script
        """
        if self.compressionLevel == 0:
            return script

        lengthBefore = len(script)

        # first, substitute string literals by placeholders to prevent the
        # regexes messing with them
        literals = []

        def insertMarker(mo):
            l = mo.group()
            literals.append(l)
            return self.literalMarker % (len(literals) - 1)

        script = self.findLiterals.sub(insertMarker, script)

        # now, to the literal-stripped carcass, apply some kludgy regexes for
        # deflation...
        script = self.slc.sub('', script)       # strip single line comments
        script = self.mlc1.sub(
            ' ', script)     # replace /* .. */ comments on single lines by space
        script = self.mlc.sub(
            '\n', script)     # replace real multiline comments by newlines

        # remove empty lines and trailing whitespace
        script = '\n'.join([l.rstrip()
                           for l in script.splitlines() if l.strip()])

        if self.compressionLevel == 2:              # squeeze out any dispensible whitespace
            script = self.squeeze.sub('', script)
        elif self.compressionLevel == 1:            # only collapse multiple whitespace characters
            script = self.collapseWs.sub(' ', script)

        # now back-substitute the string and regex literals
        def backsub(mo):
            return literals[int(mo.group(1))]

        script = self.backSubst.sub(backsub, script)

        if self.measureCompression:
            lengthAfter = float(len(script))
            squeezedBy = int(100 * (1 - lengthAfter / lengthBefore))
            script += '\n// squeezed out %s%%\n' % squeezedBy

        return script
