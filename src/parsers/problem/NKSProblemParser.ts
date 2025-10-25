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

        // 提取 cid 和 tid
        const params = new URLSearchParams(url.split('?')[1]);
        const cid = params.get('cid');
        const tid = params.get('tid');
        const shortName = `NKS ${cid} ${tid}`;

        // 解析题目名称
        const titleElem = elem.querySelector('#TdMainTitle');
        const fullTitle = titleElem.textContent.trim().replace(/^[a-zA-Z]\s+/, ''); // 移除任意字母开头的pid前缀
        await task.setName(fullTitle, shortName);

        // 解析时间限制和空间限制（从评测说明提取）
        task.setTimeLimit(1000); // 评测说明指定1s
        task.setMemoryLimit(1024); // 评测说明指定1GB=1024MB

        // 【核心优化】自动识别所有样例（支持任意数量）
        this.parseAllSamples(elem, task);

        return task.build();
    }

    /**
     * 自动识别页面中所有样例输入输出，按编号排序后配对
     */
    private parseAllSamples(elem: Element, task: TaskBuilder): void {
        // 1. 匹配所有样例输入（ID以SampleInput-开头）
        const inputElements = Array.from(elem.querySelectorAll('[id^="SampleInput-"]'))
            .map(el => ({
                id: el.id,
                number: parseInt(el.id.split('-')[1], 10), // 提取编号（0、1、2...）
                content: el.textContent.trim()
            }))
            .sort((a, b) => a.number - b.number); // 按编号升序排序

        // 2. 匹配所有样例输出（ID以SampleOutput-开头）
        const outputElements = Array.from(elem.querySelectorAll('[id^="SampleOutput-"]'))
            .map(el => ({
                id: el.id,
                number: parseInt(el.id.split('-')[1], 10),
                content: el.textContent.trim()
            }))
            .sort((a, b) => a.number - b.number);

        // 3. 按编号配对输入输出（确保一一对应）
        const maxSampleCount = Math.min(inputElements.length, outputElements.length);
        for (let i = 0; i < maxSampleCount; i++) {
            const input = inputElements[i].content;
            const output = outputElements[i].content;
            task.addTest(input, output);
        }
    }
}