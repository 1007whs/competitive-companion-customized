import { Sendable } from '../../models/Sendable';
import { TaskBuilder } from '../../models/TaskBuilder';
import { htmlToElement } from '../../utils/dom';
import { Parser } from '../Parser';

export class NKSProblemParser extends Parser {
    public getMatchPatterns(): string[] {
        return ['http://oi.nks.edu.cn/zh/Problem/Details*'];
    }
    public async parse(url: string, html: string): Promise<Sendable> {
        const elem = htmlToElement(html);
        const task = new TaskBuilder('NKS OJ').setUrl(url);
        const params = new URLSearchParams(url.split('?')[1]);
        const cid = params.get('cid');
        const tid = params.get('tid');
        const shortName = `NKS ${cid} ${tid}`;
        const titleElem = elem.querySelector('#TdMainTitle');
        const fullTitle = titleElem.textContent.trim().replace(/^[a-zA-Z]\s+/, '');
        await task.setName(fullTitle, shortName);
        task.setTimeLimit(1000);
        task.setMemoryLimit(1024);
        this.parseSamplesWithChineseCleanup(elem, task);
        return task.build();
    }
    private parseSamplesWithChineseCleanup(elem: Element, task: TaskBuilder): void {
        const inputElements = Array.from(elem.querySelectorAll('[id^="SampleInput-"]'))
            .map(el => {
                const pTag = el.querySelector('p');
                if (!pTag) return { number: -1, content: '' };
                let content = pTag.innerHTML
                    .replace(/<\/?p>/gi, '')
                    .replace(/&nbsp;|&#160;/gi, ' ')
                    .trim();
                content = this.removeChineseExplanation(content);
                return {
                    number: parseInt(el.id.split('-')[1], 10),
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
                    .trim();
                content = this.removeChineseExplanation(content);
                return {
                    number: parseInt(el.id.split('-')[1], 10),
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
        if (!chineseMatch) {
            return content;
        }
        const cutoffIndex = chineseMatch.index;
        let cleaned = content.substring(0, cutoffIndex);
        return cleaned;
    }
}