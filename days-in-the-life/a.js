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
            let curr = null; 
            let next = null; 
            let trg = null;
            if (timestampPrecedsImage) {
                next = arr[i];
                curr = (i === 0) ? {from: NaN, to: 0} : arr[i-1];
                trg = next
            } else {
                curr = arr[i]
                next = arr[i + 1]
                if (i + 1 >= arr.length) {
                    next = {from: arr.length, to: arr.length}
                }    
                trg = curr
            }

            const frag = s.substring(curr.to, next.from)
            if (!frag.trim().length) {
                throw new Error(`Bad fragment (${p}, i=${i}): curr.to=${curr.to} next.from=${next.from}`)
            }
            const m = frag.match(/[^\d]([\d]{1,2}:[\d]{2})[^\d]/)
            if (!m) {
                // console.log(`Could not find a time stamp in (ordinal: ${i}) <${frag}>`)
                trg.timestamp = ''
            } else {
                trg.timestamp = m[1]
            }
        }

        let isPm = false
        let hasPrevHour = false
        let prevHour = undefined
        for (let i = 0; i < arr.length; ++i) {
            const curr = arr[i].timestamp
            if (!curr) {
                continue
            }

            if (curr == '12:15') {
                arr[i].timestamp = '00:24'
                console.log('Forced: ' + arr[i].timestamp)
                continue
            }

            const m = curr.match(/([\d]{1,2}):([\d]{2})/)
            if (!m) {
                throw new Error('does not make sense: timestamp=' + curr)
            }

            let h = Number.parseInt(m[1])
            if (!hasPrevHour) {
                prevHour = h
                hasPrevHour = true
                console.log(`** <${curr}>`)
                if (arr[i].timestamp.length < 5) {
                    arr[i].timestamp = `0${arr[i].timestamp}`
                }
                continue
            }

            if (!isPm && h < prevHour) {
                if (prevHour < 12) {
                    console.log('h=' + h + ' prevHour=' + prevHour)
                    isPm = true
                } else {
                    isPm = false
                }
            }

            if (isPm && h < 12) {
                h += 12
                let t = `${h}:${m[2]}`
                arr[i].timestamp = t
            }


            if (arr[i].timestamp.length < 5) {
                arr[i].timestamp = `0${arr[i].timestamp}`
            }

            console.log(`${curr} -> ${arr[i].timestamp} (${prevHour}) ${isPm ? 'isPm': ''}`)
            prevHour = h

            // if (h >= 12) {
            //     isPm = true
            // }
        }

        console.log("\n")
    }

    const s = fs.readFileSync(path.resolve(p, 'index.html'), 'utf-8')

    let index = 0
    while (index >= 0) {
        index = findNext(s, index)
    }

    extractTimestamps(s)

    if (p.endsWith('brookyln')) {
        arr[arr.length-1].timestamp = '20:00'    
    }


    return arr
}

const base = fs.readFileSync('base.html', 'utf-8')

const locations = [
        { loc: 'lower-kerem', dir: 'before' }, 
        { loc: 'upper-kerem', dir: 'before' },
        { loc: 'tlv', dir: 'before' }, 
        { loc: 'brookyln' }
    ]
const arrs = locations.map(l => readOneDay(`zips/${l.loc}`, l.dir === 'before'))
// const arr = readOneDay('zips/brookyln')

// console.log(JSON.stringify(arr, null, 2))



function renderOneDay(a) {
    return a.map(curr => 
        `<section><div class="my-grid" class="stretch"><div>${curr.timestamp}</div><div><img style="width: 100%; height: 100%" data-src="days-in-the-life/${curr.image}"></div></div></section>`).join('\n')
}

const replacement = arrs.map(curr => `<section>${renderOneDay(curr)}</section>`).join('\n')

const output = base.replace('__YOUR_CONTENT_HERE__', replacement)

fs.writeFileSync('../index.html', output, 'utf-8')

// console.log(s)
// console.log('len=' + s.length)

