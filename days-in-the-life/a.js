const fs = require('fs')
const path = require('path')


function readOneDay(p) {
    const s = fs.readFileSync(path.resolve(p, 'index.html'), 'utf-8')

    function findNext(s, startAt, acc) {
        const keyword='src="images/image'
        let index = s.indexOf(keyword, startAt)
        if (index < 0) {
            return -1
        }

        index += keyword.length
        let q = s.indexOf('"', index)
        if (q < 0) {
            throw new Error('Could not find a closing double quote after ' + index)
        }

        const str = s.substring(index, q).trim()
        if (!str) {
            throw new Error('After trimming got falsy (index=' + index + ')')
        }
        acc.push(path.relative('zips', path.resolve(p, 'images/image' + str)))

        return q + 1 
    }


    const arr = []
    let index = 0
    while (index >= 0) {
        index = findNext(s, index, arr)
    }

    return arr
}

const base = fs.readFileSync('base.html', 'utf-8')
const arr = readOneDay('zips/brookyln')

const replacement = arr.map((curr, i) => 
    `<section>Slide ${i}<img class="stretch" data-src="days-in-the-life/${curr}"></section>`).join('\n')

const output = base.replace('__YOUR_CONTENT_HERE__', replacement)

fs.writeFileSync('../index.html', output, 'utf-8')

// console.log(s)
// console.log('len=' + s.length)

