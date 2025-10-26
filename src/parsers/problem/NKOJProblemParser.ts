import { Sendable } from '../../models/Sendable';
import { TaskBuilder } from '../../models/TaskBuilder';
import { htmlToElement } from '../../utils/dom';
import { Parser } from '../Parser';
export class NKOJProblemParser extends Parser {
    public getMatchPatterns(): string[] { return ['http://oi.nks.edu.cn/zh/Problem/Details*',]; }
    public async parse(url: string, html: string): Promise<Sendable> {
        const elem = htmlToElement(html);
        const task = new TaskBuilder('NKS OJ').setUrl(url);
        const { problemNo, cid, tid } = this.extractProblemNo(url, html);
        const titleElem = elem.querySelector('#TdMainTitle');
        const originalTitle = titleElem.textContent.trim();
        const titleBody = originalTitle.replace(/^((P\d+)|[A-Za-z])[\s:-]*/, '').trim();
        const fullTitle = `${problemNo} - ${titleBody}`;
        const shortName = tid ? `NKS ${cid} ${tid}` : `P${problemNo.slice(1)}`;
        await task.setName(fullTitle, shortName);
        task.setTimeLimit(1000);
        task.setMemoryLimit(1024);
        this.parseSamplesWithChineseCleanup(elem, task);
        return task.build();
    }
    private extractProblemNo(url: string, html: string): { problemNo: string; cid?: string; tid?: string } {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(part => part);
        const queryParams = new URLSearchParams(urlObj.search);
        if (pathParts.length >= 4 && /^\d+$/.test(pathParts[3])) {
            const pid = pathParts[3];
            return { problemNo: `P${pid}` };
        }
        const cid = queryParams.get('cid');
        const tid = queryParams.get('tid');
        if (cid && tid) {
            return { problemNo: tid, cid, tid };
        }
        const tempElem = htmlToElement(html);
        const titleElem = tempElem.querySelector('#TdMainTitle');
        const pidMatch = titleElem?.textContent.match(/P(\d+)/);
        return { problemNo: pidMatch ? `P${pidMatch[1]}` : 'Unknown' };
    }
    private parseSamplesWithChineseCleanup(elem: Element, task: TaskBuilder): void {
        const inputElements = Array.from(elem.querySelectorAll('[id^="SampleInput-"]'))
            .map(el => {
                const pTag = el.querySelector('p');
                if (!pTag) return { number: -1, content: '' };
                let content = pTag.innerHTML
                    .replace(/<\/?p>/gi, '')
                    .replace(/&nbsp;|&#160;/gi, ' ')
                    .replace(/<br\/?>/gi, '\n')
                    .trim();
                content = this.removeChineseExplanation(content);
                return {
                    number: parseInt(el.id.split('-')[1], 10) || 0,
                    content
                };
            })
            .filter(item => item.number !== -1)
            .sort((a, b) => a.number - b.number);
        const outputElements = Array.from(elem.querySelectorAll('[id^="SampleOutput-"]'))
            .map(el => {
                const pTag = el.querySelector('p');
                if (!pTag) return { number: -1, content: '' };
                let content = pTag.innerHTML
                    .replace(/<\/?p>/gi, '')
                    .replace(/&nbsp;|&#160;/gi, ' ')
                    .replace(/<br\/?>/gi, '\n')
                    .trim();
                content = this.removeChineseExplanation(content);
                return {
                    number: parseInt(el.id.split('-')[1], 10) || 0,
                    content
                };
            })
            .filter(item => item.number !== -1)
            .sort((a, b) => a.number - b.number);
        const maxCount = Math.min(inputElements.length, outputElements.length);
        for (let i = 0; i < maxCount; i++) {
            task.addTest(inputElements[i].content, outputElements[i].content);
        }
    }
    private removeChineseExplanation(content: string): string {
        const chineseMatch = content.match(/[\u4e00-\u9fa5]/);
        if (!chineseMatch) return content;
        return content.substring(0, chineseMatch.index).trim();
    }
}