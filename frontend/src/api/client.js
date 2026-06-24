const BASE = '/api';
async function request(url, options) {
    const token = sessionStorage.getItem('auth_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token)
        headers['x-auth-token'] = token;
    const mergedHeaders = { ...headers, ...options?.headers };
    const res = await fetch(`${BASE}${url}`, { ...options, headers: mergedHeaders });
    if (res.status === 401) {
        sessionStorage.removeItem('auth_token');
        window.location.href = '/auth';
        throw new Error('Sesi berakhir.');
    }
    if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'Gagal memuat data.' }));
        throw new Error(body.message || `HTTP ${res.status}`);
    }
    return res.json();
}
export async function fetchSubjects() {
    const data = await request('/subjects');
    return data.subjects;
}
export async function fetchTopics(subjectId) {
    const data = await request(`/topics?subject_id=${subjectId}`);
    return data.topics;
}
export async function fetchRandomQuestion(topicId, excludeIds) {
    let url = `/questions/random?topic_id=${topicId}`;
    if (excludeIds && excludeIds.length > 0) {
        url += `&exclude=${excludeIds.join(',')}`;
    }
    const data = await request(url);
    return data.question;
}
export async function checkAnswer(questionId, selectedKeys) {
    return request(`/questions/${questionId}/check`, {
        method: 'POST',
        body: JSON.stringify({ selected_keys: selectedKeys }),
    });
}
export async function fetchQuestionCount(topicId) {
    const data = await request(`/questions/count?topic_id=${topicId}`);
    return data.count;
}
export async function fetchTopic(topicId) {
    try {
        const data = await request(`/topics/${topicId}`);
        return data.topic;
    }
    catch {
        return null;
    }
}
