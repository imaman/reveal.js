const fs = require('fs')
const path = require('path')


function readOneDay(p, timestampPrecedsImage) {
    const arr = []

    function findNext(s, startAt) {
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
        arr.push({from: index, to: q, image: path.relative('zips', path.resolve(p, 'images/image' + str))})

        return q + 1 
    }


    function extractTimestamps(s) {
        for (let i = 0; i < arr.length; ++i) {
            let curr = arr[i]
            let next = arr[i + 1]
            if (i + 1 >= arr.length) {
                next = {from: arr.length, to: arr.length}
            }

            const frag = s.substring(curr.to, next.from)
            if (!frag.trim().length) {
                throw new Error('Bad fragment: curr.to=' +curr.to + ' next.from=' + next.from)
            }
            const m = frag.match(/[^\d]([\d]{1,2}:[\d]{2})[^\d]/)

            let trg = timestampPrecedsImage ? next : curr
            if (!m) {
                console.log(`Could not find a time stamp in (ordinal: ${i}) <${frag}>`)
                trg.timestamp = '???'
            } else {
                trg.timestamp = m[1]
            }
        }
    }

    const s = fs.readFileSync(path.resolve(p, 'index.html'), 'utf-8')

    let index = 0
    while (index >= 0) {
        index = findNext(s, index)
    }

    extractTimestamps(s)


    return arr
}

const base = fs.readFileSync('base.html', 'utf-8')

const locations = [
        { loc: 'brookyln' }, 
        { loc: 'tlv', dir: 'before' }, 
        { loc: 'lower-kerem', dir: 'before' }, 
        { loc: 'upper-kerem', dir: 'before' }
    ]
const arrs = locations.map(l => readOneDay(`zips/${l.loc}`, l.dir === 'before'))
// const arr = readOneDay('zips/brookyln')

// console.log(JSON.stringify(arr, null, 2))



function renderOneDay(a) {
    return a.map(curr => 
        `<section>${curr.timestamp}<br><img class="stretch" data-src="days-in-the-life/${curr.image}"></section>`).join('\n')
}

const replacement = arrs.map(curr => `<section>${renderOneDay(curr)}</section>`).join('\n')

const output = base.replace('__YOUR_CONTENT_HERE__', replacement)

fs.writeFileSync('../index.html', output, 'utf-8')

// console.log(s)
// console.log('len=' + s.length)

